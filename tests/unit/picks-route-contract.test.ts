import express from 'express';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const savePick = vi.fn();
const selectWhere = vi.fn();

vi.mock('../../server/auth/guards', () => ({
  isAuthenticated: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', role: 'user' };
    next();
  },
  isAdmin: () => false,
}));

vi.mock('../../server/middleware/fightState', () => ({
  verifyFightState: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../server/services/pickService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../server/services/pickService')>();
  return { ...actual, savePick, deletePick: vi.fn() };
});

vi.mock('../../server/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: selectWhere }) }),
  },
}));

vi.mock('../../server/services/pickAggregationService', () => ({
  pickAggregator: { trackPick: vi.fn() },
}));
vi.mock('../../server/utils/eventCache', () => ({ eventCache: { invalidate: vi.fn() } }));
vi.mock('../../server/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), metric: vi.fn() },
}));

async function startServer() {
  const { registerPicksRoutes } = await import('../../server/user/routes/picksRoutes');
  const app = express();
  app.use(express.json());
  registerPicksRoutes(app);
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

describe('POST /api/picks contract', () => {
  let close: (() => Promise<void>) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    const fight = {
      id: 'fight-1', eventId: 'event-1', fighter1Id: 'fighter-1', fighter2Id: 'fighter-2',
      rounds: 3, odds: { fighter1Odds: '-150', fighter2Odds: '+130' }, scheduledTime: null,
    };
    const event = { id: 'event-1', date: new Date(Date.now() + 86_400_000), lockTime: null };
    selectWhere.mockResolvedValueOnce([fight]).mockResolvedValueOnce([event]);
    savePick.mockResolvedValue({
      savedPick: { id: 'pick-1', userId: 'user-1', fightId: 'fight-1', units: 1 },
      previousFighterId: null,
    });
  });

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  it('passes the exact browser payload to the canonical service', async () => {
    const server = await startServer();
    close = server.close;
    const response = await fetch(`${server.baseUrl}/api/picks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fightId: 'fight-1',
        pickedFighterId: 'fighter-1',
        pickedMethod: 'KO/TKO',
        pickedRound: 2,
        units: 1,
        confidenceFlag: 'yellow',
      }),
    });

    expect(response.status).toBe(200);
    expect(savePick).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      pick: {
        fightId: 'fight-1', pickedFighterId: 'fighter-1', pickedMethod: 'KO/TKO',
        pickedRound: 2, units: 1, confidenceFlag: 'yellow',
      },
    }));
  });

  it('rejects the legacy payload before persistence', async () => {
    const server = await startServer();
    close = server.close;
    const response = await fetch(`${server.baseUrl}/api/picks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fightId: 'fight-1', predictedWinnerId: 'fighter-1', method: 'Decision' }),
    });

    expect(response.status).toBe(400);
    expect(savePick).not.toHaveBeenCalled();
  });
});
