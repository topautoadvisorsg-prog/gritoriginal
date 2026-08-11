/**
 * Outbound Sync Service
 *
 * Pushes data from the main app to the data engine's Supabase instance.
 * Credentials prefer deployment-managed environment variables. A legacy
 * database read fallback remains temporarily for migration compatibility;
 * new secret database writes are rejected.
 *
 * Triggered after admin approves & applies a pipeline entry, and when
 * admin directly edits a fighter, event, or news article.
 */

import { logger } from '../utils/logger';
import { getDataEngineConfig } from './dataEngineService';

// ─── Credential helpers ──────────────────────────────────────────────────────

async function getSupabaseCredentials(): Promise<{ url: string; key: string }> {
  const [url, key] = await Promise.all([
    getDataEngineConfig('SUPABASE_URL'),
    getDataEngineConfig('SUPABASE_API_KEY'),
  ]);
  if (!url || !key) {
    throw new OutboundSyncError(
      'OUTBOUND_SYNC_NOT_CONFIGURED',
      'Supabase outbound-sync credentials are not configured',
    );
  }
  return { url, key };
}

export class OutboundSyncError extends Error {
  constructor(
    public readonly code: 'OUTBOUND_SYNC_NOT_CONFIGURED' | 'OUTBOUND_SYNC_INVALID_RECORD',
    message: string,
  ) {
    super(message);
    this.name = 'OutboundSyncError';
  }
}

/**
 * For updates — PATCH by ID. Doesn't require all NOT NULL columns.
 * For creates — POST with full data (all NOT NULL columns must be present).
 */
async function supabasePatch(
  table: string,
  record: Record<string, unknown>,
  credentials: { url: string; key: string },
): Promise<void> {
  const endpoint = `${credentials.url}/rest/v1/${table}?id=eq.${record.id}`;
  const res = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': credentials.key,
      'Authorization': `Bearer ${credentials.key}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(record),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase PATCH to ${table} failed (${res.status}): ${body}`);
  }
}

async function supabaseInsert(
  table: string,
  record: Record<string, unknown>,
  credentials: { url: string; key: string },
): Promise<void> {
  const endpoint = `${credentials.url}/rest/v1/${table}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': credentials.key,
      'Authorization': `Bearer ${credentials.key}`,
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(record),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase INSERT to ${table} failed (${res.status}): ${body}`);
  }
}

async function supabaseDelete(
  table: string,
  record: Record<string, unknown>,
  credentials: { url: string; key: string },
): Promise<void> {
  const endpoint = `${credentials.url}/rest/v1/${table}?id=eq.${record.id}`;
  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'apikey': credentials.key,
      'Authorization': `Bearer ${credentials.key}`,
      'Prefer': 'return=minimal',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase DELETE from ${table} failed (${res.status}): ${body}`);
  }
}

// ─── Field mappers ───────────────────────────────────────────────────────────

/**
 * Convert a camelCase object to snake_case for Supabase.
 * Handles one level deep — nested objects are passed through as-is (JSON columns).
 */
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

function toRecord(data: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data));
}

/** Pick only the fields that exist in Supabase fighters table. */
function mapFighterToSupabase(data: object): Record<string, unknown> {
  const snake = toSnakeCase(toRecord(data));
  // Supabase fighters fields (all known columns)
  const allowed = new Set([
    'id','first_name','last_name','nickname','date_of_birth','nationality','gender',
    'weight_class','stance','gym','head_coach','team','fighting_out_of',
    'height_inch','reach_inch','leg_reach_inch','wins','losses','draws','nc',
    'image_url','body_image_url','organization','physical_stats','record','performance',
    'odds','notes','risk_signals','camp_start_date','training_partners','dominant_hand',
    'dominant_foot','is_active','ranking','rank_global','rank_promotion','is_champion',
    'is_verified','last_updated','style','bio','ai_preferences','social_media',
  ]);
  return Object.fromEntries(Object.entries(snake).filter(([k]) => allowed.has(k)));
}

/** Pick only the fields that exist in Supabase events table. */
function mapEventToSupabase(data: object): Record<string, unknown> {
  const snake = toSnakeCase(toRecord(data));
  const allowed = new Set([
    'id','name','date','venue','city','state','country',
    'organization','description','status',
  ]);
  return Object.fromEntries(Object.entries(snake).filter(([k]) => allowed.has(k)));
}

/** Pick only the fields that exist in Supabase fight_history table. */
function mapFightHistoryToSupabase(data: object): Record<string, unknown> {
  const snake = toSnakeCase(toRecord(data));
  const allowed = new Set([
    'id','fighter_id','event_id','fighter_name','fighter_nickname',
    'opponent_id','opponent_name','opponent_nickname','opponent_linked',
    'event_name','event_date','event_promotion','weight_class','fight_type',
    'billing','bout_order','rounds_scheduled','round_duration_minutes','location',
    'result','method','method_detail','round','time','fight_duration_seconds',
    'title_fight','title_fight_detail','referee','round_time_format',
    'judges_scores_data','per_round_stats','is_locked','stats','odds_snapshot',
    'travel_distance','venue_altitude','media_pressure','gym_changes',
    'injury_flags','referee_notes','penalty_deductions','weight_cut_success',
    'admin_notes','version',
  ]);
  return Object.fromEntries(Object.entries(snake).filter(([k]) => allowed.has(k)));
}

/** Pick only the fields that exist in Supabase news_articles table. */
function mapNewsToSupabase(data: object): Record<string, unknown> {
  const snake = toSnakeCase(toRecord(data));
  const allowed = new Set([
    'id','title','subtitle','excerpt','content','author','image_url','tags',
    'event_reference','fighter_reference','read_time','is_published','published_at',
  ]);
  return Object.fromEntries(Object.entries(snake).filter(([k]) => allowed.has(k)));
}

/** Pick only the fields that exist in Supabase event_fights table. */
function mapEventFightToSupabase(data: object): Record<string, unknown> {
  const snake = toSnakeCase(toRecord(data));
  // scheduledTime not in Supabase — excluded via allowed set
  const allowed = new Set([
    'id','event_id','fighter1_id','fighter2_id','card_placement','bout_order',
    'weight_class','is_title_fight','rounds','status','odds',
    'time_format','round_end','time_end','method','referee',
    'winner_id','fighter1_result','fighter2_result',
  ]);
  return Object.fromEntries(Object.entries(snake).filter(([k]) => allowed.has(k)));
}

// ─── Public sync functions ────────────────────────────────────────────────────

export type SyncAction = 'create' | 'update' | 'delete';

async function _syncEntity(
  table: string,
  record: Record<string, unknown>,
  action: SyncAction,
  label: string,
): Promise<void> {
  if (!record.id) {
    throw new OutboundSyncError(
      'OUTBOUND_SYNC_INVALID_RECORD',
      `${label} outbound-sync record is missing an id`,
    );
  }
  const creds = await getSupabaseCredentials();
  if (action === 'create') {
    await supabaseInsert(table, record, creds);
  } else if (action === 'delete') {
    await supabaseDelete(table, record, creds);
  } else {
    await supabasePatch(table, record, creds);
  }
  logger.info(`[OutboundSync] ${label} ${record.id} synced to Supabase (${action})`);
}

export async function syncFighterToSupabase(
  data: object,
  action: SyncAction = 'update',
): Promise<void> {
  try {
    await _syncEntity('fighters', mapFighterToSupabase(data), action, 'Fighter');
  } catch (err) {
    logger.error('[OutboundSync] Fighter sync failed:', err);
    throw err;
  }
}

export async function syncEventToSupabase(
  data: object,
  action: SyncAction = 'update',
): Promise<void> {
  try {
    await _syncEntity('events', mapEventToSupabase(data), action, 'Event');
  } catch (err) {
    logger.error('[OutboundSync] Event sync failed:', err);
    throw err;
  }
}

export async function syncFightHistoryToSupabase(
  data: object,
  action: SyncAction = 'update',
): Promise<void> {
  try {
    await _syncEntity('fight_history', mapFightHistoryToSupabase(data), action, 'FightHistory');
  } catch (err) {
    logger.error('[OutboundSync] Fight history sync failed:', err);
    throw err;
  }
}

export async function syncNewsToSupabase(
  data: object,
  action: SyncAction = 'update',
): Promise<void> {
  try {
    await _syncEntity('news_articles', mapNewsToSupabase(data), action, 'News');
  } catch (err) {
    logger.error('[OutboundSync] News sync failed:', err);
    throw err;
  }
}

export async function syncEventFightToSupabase(
  data: object,
  action: SyncAction = 'update',
): Promise<void> {
  try {
    await _syncEntity('event_fights', mapEventFightToSupabase(data), action, 'EventFight');
  } catch (err) {
    logger.error('[OutboundSync] EventFight sync failed:', err);
    throw err;
  }
}
