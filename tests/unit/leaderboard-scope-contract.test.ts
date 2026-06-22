import express from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const select = vi.fn();
const limit = vi.fn();

vi.mock('../../server/db', () => ({ db: { select } }));
vi.mock('../../server/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

async function startServer() {
  const { registerLeaderboardRoutes } = await import('../../server/user/routes/leaderboardRoutes');
  const { registerSnapshotRoutes } = await import('../../server/user/routes/snapshotRoutes');
  const app = express();
  registerLeaderboardRoutes(app);
  registerSnapshotRoutes(app);
  const server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to start test server');
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

describe('leaderboard scope contracts', () => {
  let close: (() => Promise<void>) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    limit.mockResolvedValue([]);
    select.mockReturnValue({
      from: () => ({
        where: () => ({ orderBy: () => ({ limit }) }),
        orderBy: () => ({ limit }),
      }),
    });
  });

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  it('rejects eventId on the global endpoint instead of returning lifetime data', async () => {
    const server = await startServer();
    close = server.close;
    const response = await fetch(`${server.baseUrl}/api/leaderboard?eventId=event-1`);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: 'EVENT_SCOPE_REQUIRES_EXPLICIT_ROUTE' });
    expect(select).not.toHaveBeenCalled();
  });

  it('rejects malformed event IDs before querying snapshots', async () => {
    const server = await startServer();
    close = server.close;
    const response = await fetch(`${server.baseUrl}/api/leaderboard/event/not-a-uuid`);
    expect(response.status).toBe(400);
    expect(select).not.toHaveBeenCalled();
  });

  it('returns the newest explicit event snapshot result', async () => {
    const snapshot = { id: 'snapshot-1', snapshotType: 'event', rankings: [] };
    limit.mockResolvedValueOnce([snapshot]);
    const server = await startServer();
    close = server.close;
    const response = await fetch(`${server.baseUrl}/api/leaderboard/event/11111111-1111-4111-8111-111111111111`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(snapshot);
    expect(limit).toHaveBeenCalledWith(1);
  });

  it('keeps latest snapshots period-only', async () => {
    const server = await startServer();
    close = server.close;
    const response = await fetch(`${server.baseUrl}/api/leaderboard/latest/event`);
    expect(response.status).toBe(400);
    expect(select).not.toHaveBeenCalled();
  });

  it('rejects unsupported history scope and unsafe limits', async () => {
    const server = await startServer();
    close = server.close;
    const response = await fetch(`${server.baseUrl}/api/leaderboard/history?type=weekly&limit=1000`);
    expect(response.status).toBe(400);
    expect(select).not.toHaveBeenCalled();
  });
});
