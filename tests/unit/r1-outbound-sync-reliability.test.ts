import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getDataEngineConfig: vi.fn(),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../server/services/dataEngineService', () => ({
  getDataEngineConfig: mocks.getDataEngineConfig,
}));

vi.mock('../../server/utils/logger', () => ({
  logger: mocks.logger,
}));

import {
  OutboundSyncError,
  syncFighterToSupabase,
} from '../../server/services/outboundSyncService';

describe('R1 outbound-sync reliability boundary', () => {
  beforeEach(() => {
    mocks.getDataEngineConfig.mockImplementation(async (key: string) => (
      key === 'SUPABASE_URL' ? 'https://example.supabase.co' : 'service-role-key'
    ));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('rejects remote HTTP failures so pg-boss can retry the job', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'temporarily unavailable',
    }));

    await expect(syncFighterToSupabase({ id: 'fighter-1' }))
      .rejects.toThrow('Supabase PATCH to fighters failed (503)');
    expect(mocks.logger.error).toHaveBeenCalledWith(
      '[OutboundSync] Fighter sync failed:',
      expect.any(Error),
    );
  });

  it('rejects missing credentials instead of acknowledging a skipped delivery', async () => {
    mocks.getDataEngineConfig.mockResolvedValue(null);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(syncFighterToSupabase({ id: 'fighter-1' })).rejects.toMatchObject({
      name: 'OutboundSyncError',
      code: 'OUTBOUND_SYNC_NOT_CONFIGURED',
    } satisfies Partial<OutboundSyncError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an identity-free payload before credential lookup or delivery', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(syncFighterToSupabase({ firstName: 'No', lastName: 'Identity' }))
      .rejects.toMatchObject({
        name: 'OutboundSyncError',
        code: 'OUTBOUND_SYNC_INVALID_RECORD',
      } satisfies Partial<OutboundSyncError>);
    expect(mocks.getDataEngineConfig).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('preserves delete intent as an idempotent remote DELETE', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await syncFighterToSupabase({ id: 'fighter-1' }, 'delete');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/rest/v1/fighters?id=eq.fighter-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('keeps queue startup and pipeline handoff fail-closed and post-commit', () => {
    const jobService = readFileSync(
      new URL('../../server/services/jobService.ts', import.meta.url),
      'utf8',
    );
    const dataEngine = readFileSync(
      new URL('../../server/services/dataEngineService.ts', import.meta.url),
      'utf8',
    );
    const userServer = readFileSync(
      new URL('../../server/user-server.ts', import.meta.url),
      'utf8',
    );
    const adminFighters = readFileSync(
      new URL('../../server/admin/routes/adminFighterRoutes.ts', import.meta.url),
      'utf8',
    );
    const adminEvents = readFileSync(
      new URL('../../server/admin/routes/adminEventRoutes.ts', import.meta.url),
      'utf8',
    );
    const fightResolution = readFileSync(
      new URL('../../server/admin/routes/adminFightResolutionRoutes.ts', import.meta.url),
      'utf8',
    );

    expect(jobService).not.toContain('falling back to setImmediate');
    expect(jobService).toContain("throw new Error('Outbound-sync queue is not initialized')");
    expect(jobService).toContain('const action: OutboundSyncAction = entry.actionType');
    expect(jobService).toContain("case 'event_fight':");
    expect(userServer).toContain('await initJobService();');

    const transactionEnd = dataEngine.indexOf('  });', dataEngine.indexOf('export async function applyEntry'));
    const enqueueLoop = dataEngine.indexOf('for (const outboundEntry of outboundEntries)');
    expect(enqueueLoop).toBeGreaterThan(transactionEnd);
    expect(dataEngine).not.toContain('setImmediate(() => {\n      for (const row of fightRows)');
    expect(dataEngine).toContain('errorLog: `Outbound sync enqueue failed:');
    for (const routeSource of [adminFighters, adminEvents, fightResolution]) {
      expect(routeSource).toContain('enqueueOutboundSync({');
      expect(routeSource).not.toContain("from '../../services/outboundSyncService'");
    }
  });
});
