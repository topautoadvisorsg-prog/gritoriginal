import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { apiErrorHandler } from '../../server/middleware/errorHandler';
import {
  configureHttpSecurity,
  registerJsonBodyParsers,
} from '../../server/middleware/httpSecurity';

const servers: Array<ReturnType<ReturnType<typeof express>['listen']>> = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve, reject) => {
    if (!server.listening) return resolve();
    server.close(error => error ? reject(error) : resolve());
  })));
});

async function listen(app: ReturnType<typeof express>): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      resolve(`http://127.0.0.1:${address.port}`);
    });
    servers.push(server);
    server.once('error', reject);
  });
}

describe('R1 HTTP security boundary', () => {
  it('sets conservative production headers and one trusted Railway proxy hop', async () => {
    const app = express();
    configureHttpSecurity(app, 'production');
    app.get('/health', (_req, res) => res.json({ ok: true }));

    expect(app.get('trust proxy')).toBe(1);
    const baseUrl = await listen(app);
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-powered-by')).toBeNull();
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(response.headers.get('cross-origin-opener-policy')).toBe('same-origin-allow-popups');
    expect(response.headers.get('permissions-policy')).toBe('camera=(), microphone=(), geolocation=()');
    expect(response.headers.get('content-security-policy')).toBeNull();
    expect(response.headers.get('strict-transport-security')).toBeNull();
  });

  it('does not trust proxy headers by default outside production', () => {
    const app = express();
    configureHttpSecurity(app, 'test');
    expect(app.get('trust proxy')).toBe(false);
  });

  it('rejects JSON bodies larger than the global one-megabyte budget', async () => {
    const app = express();
    configureHttpSecurity(app, 'test');
    registerJsonBodyParsers(app);
    app.post('/api/test', (_req, res) => res.status(204).end());
    app.use(apiErrorHandler);

    const baseUrl = await listen(app);
    const response = await fetch(`${baseUrl}/api/test`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: 'x'.repeat(1024 * 1024 + 1) }),
    });

    expect(response.status).toBe(413);
  });

  it('preserves the bounded large-import exception', async () => {
    const app = express();
    configureHttpSecurity(app, 'test');
    registerJsonBodyParsers(app);
    app.post('/api/fighters/:id/import-history', (_req, res) => res.status(204).end());
    app.use(apiErrorHandler);

    const baseUrl = await listen(app);
    const response = await fetch(`${baseUrl}/api/fighters/fighter-1/import-history`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ csvData: 'x'.repeat(1024 * 1024 + 1) }),
    });

    expect(response.status).toBe(204);
  });
});
