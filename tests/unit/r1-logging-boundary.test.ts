import { EventEmitter } from 'node:events';
import type { NextFunction, Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiNotFoundHandler } from '../../server/middleware/apiNotFound';
import { requestLogger } from '../../server/middleware/requestLogger';
import { redactLogValue } from '../../server/utils/logger';
import { logger } from '../../server/utils/logger';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('R1 logging boundary', () => {
  it('redacts sensitive structured fields and common credential strings', () => {
    const value = redactLogValue({
      apiKey: 'live-key-value',
      nested: {
        authorization: 'Bearer live-bearer-value',
        inputTokens: 42,
        note: 'password=live-password-value',
        database: 'postgresql://admin:live-db-password@example.test/grid',
        jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature',
      },
    });

    const serialized = JSON.stringify(value);
    expect(serialized).not.toContain('live-key-value');
    expect(serialized).not.toContain('live-bearer-value');
    expect(serialized).not.toContain('live-password-value');
    expect(serialized).not.toContain('live-db-password');
    expect(serialized).not.toContain('eyJhbGci');
    expect(serialized).toContain('[REDACTED]');
    expect(serialized).toContain('"inputTokens":42');
  });

  it('logs failed request metadata without the request body or route error text', () => {
    const response = new EventEmitter() as EventEmitter & Partial<Response>;
    response.statusCode = 422;
    response.locals = { error: 'private route error' };
    const request = {
      path: '/api/profile',
      method: 'POST',
      body: { password: 'private-request-password' },
      user: { id: 'user-1' },
    } as unknown as Request;
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    requestLogger(request, response as Response, vi.fn() as NextFunction);
    response.emit('finish');

    expect(warn).toHaveBeenCalledOnce();
    const serialized = JSON.stringify(warn.mock.calls[0]);
    expect(serialized).toContain('/api/profile');
    expect(serialized).toContain('422');
    expect(serialized).not.toContain('private-request-password');
    expect(serialized).not.toContain('private route error');
    expect(serialized).not.toContain('body');
  });

  it('returns a generic JSON 404 for unknown API routes', () => {
    const status = vi.fn();
    const json = vi.fn();
    status.mockReturnValue({ json });

    apiNotFoundHandler({} as Request, { status } as unknown as Response, vi.fn());

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: 'Not Found' });
  });

  it('registers the API 404 before the SPA fallback', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile('server/user-server.ts', 'utf8');
    expect(source.indexOf("app.use('/api', apiNotFoundHandler)"))
      .toBeLessThan(source.indexOf('app.get(/(.*)/'));
  });
});
