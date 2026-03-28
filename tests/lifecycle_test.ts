import { finalizeFightResult } from '../server/services/scoringService';
import { createLeaderboardSnapshot } from '../server/services/leaderboardService';
import { db, pool } from '../server/db';
import { userPicks, users, events } from '../shared/schema';
import { eq, inArray } from 'drizzle-orm';
import { PickStorage } from '../server/storage/picks';

const ADMIN_ID = '55450188';
const EVENT_A_ID = '77b4af8a-9bfe-4034-bac7-22450917e64e';
const pickStorage = new PickStorage();

function pass(msg: string) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg: string) { console.log(`  ❌ FAIL: ${msg}`); }
function section(title: string) { console.log(`\n=== ${title} ===`); }
async function q(text: string, params: any[] = []) { return (await pool.query(text, params)).rows; }

async function runTest() {
  console.log('=== T003: Event Lifecycle Test ===');
  console.log(`Event A: ${EVENT_A_ID}`);

  const fights = await q(
    `SELECT ef.id as fight_id, ef.fighter1_id, ef.fighter2_id
     FROM event_fights ef JOIN events e ON ef.event_id = e.id
     WHERE e.name = $1 ORDER BY ef.bout_order`,
    ['GRIT Lifecycle Test']
  );
  console.log(`\nLoaded ${fights.length} Event A fights from DB`);
  if (fights.length !== 12) { console.error(`Expected 12 fights, got ${fights.length}`); process.exit(1); }

  const fightIds = fights.map(f => f.fight_id);
  const [adminStart] = await db.select({ points: users.totalPoints }).from(users).where(eq(users.id, ADMIN_ID));
  console.log(`Admin points baseline: ${adminStart?.points}`);

  // --- Step 1: Picks editable in Upcoming state ---
  section('Step 1 — Picks editable in Upcoming state');
  const picksBefore = await db.select({ isLocked: userPicks.isLocked })
    .from(userPicks).where(inArray(userPicks.fightId, fightIds));
  picksBefore.length === 12 ? pass(`Found ${picksBefore.length}/12 picks`) : fail(`Found ${picksBefore.length}/12 picks`);
  picksBefore.every(p => !p.isLocked) ? pass('All 12 picks unlocked') : fail(`${picksBefore.filter(p => p.isLocked).length} already locked`);

  // Edit pick for fight[0] to fighter2, then revert to fighter1
  const t = fights[0];
  await q(`UPDATE user_picks SET picked_fighter_id=$1, updated_at=NOW() WHERE user_id=$2 AND fight_id=$3`, [t.fighter2_id, ADMIN_ID, t.fight_id]);
  const [ep] = await q(`SELECT picked_fighter_id FROM user_picks WHERE user_id=$1 AND fight_id=$2`, [ADMIN_ID, t.fight_id]);
  ep?.picked_fighter_id === t.fighter2_id ? pass('Pick edit to fighter2 succeeded') : fail(`Edit failed, got ${ep?.picked_fighter_id}`);

  await q(`UPDATE user_picks SET picked_fighter_id=$1, updated_at=NOW() WHERE user_id=$2 AND fight_id=$3`, [t.fighter1_id, ADMIN_ID, t.fight_id]);
  const [rp] = await q(`SELECT picked_fighter_id FROM user_picks WHERE user_id=$1 AND fight_id=$2`, [ADMIN_ID, t.fight_id]);
  rp?.picked_fighter_id === t.fighter1_id ? pass('Pick reverted to fighter1 (clean sweep intact)') : fail('Revert failed');

  // --- Step 2: Transition Upcoming → Live ---
  section('Step 2 — Transition Upcoming → Live + Lock Picks');
  await db.update(events).set({ status: 'Live' }).where(eq(events.id, EVENT_A_ID));
  const lockedCount = await pickStorage.lockPicksForEvent(EVENT_A_ID);
  console.log(`  lockPicksForEvent returned: ${lockedCount}`);

  const picksAfterLock = await db.select({ isLocked: userPicks.isLocked })
    .from(userPicks).where(inArray(userPicks.fightId, fightIds));
  picksAfterLock.every(p => p.isLocked)
    ? pass(`All ${picksAfterLock.length}/12 picks locked`)
    : fail(`Only ${picksAfterLock.filter(p => p.isLocked).length}/12 locked`);

  const [evtLive] = await db.select({ status: events.status }).from(events).where(eq(events.id, EVENT_A_ID));
  evtLive?.status === 'Live' ? pass('Event status = Live') : fail(`Event status = ${evtLive?.status}`);

  // --- Step 3: Transition Live → Completed ---
  section('Step 3 — Transition Live → Completed');
  await db.update(events).set({ status: 'Completed' }).where(eq(events.id, EVENT_A_ID));
  const [evtComp] = await db.select({ status: events.status }).from(events).where(eq(events.id, EVENT_A_ID));
  evtComp?.status === 'Completed' ? pass('Event status = Completed') : fail(`Event status = ${evtComp?.status}`);

  // --- Step 4: Finalize all 12 fights ---
  section('Step 4 — Finalize all 12 Event A fights (KO/TKO R1)');
  let ok = 0;
  for (const f of fights) {
    try {
      await finalizeFightResult(f.fight_id, { winnerId: f.fighter1_id, method: 'KO/TKO', round: 1, timeEnd: '1:23', referee: 'Test Referee' });
      ok++; process.stdout.write('.');
    } catch (err: any) { console.log(`\n  ✗ ${f.fight_id}: ${err.message}`); }
  }
  console.log('');
  ok === 12 ? pass(`${ok}/12 fights finalized`) : fail(`Only ${ok}/12`);

  const [adminAfter] = await db.select({ points: users.totalPoints }).from(users).where(eq(users.id, ADMIN_ID));
  const expected = (adminStart?.points ?? 0) + 72;
  adminAfter?.points === expected
    ? pass(`Admin points = ${adminAfter?.points} (+72 = 6pts × 12)`)
    : fail(`Points = ${adminAfter?.points}, expected ${expected}`);

  const [kr] = await q(`SELECT COUNT(*) as cnt FROM user_keys WHERE user_id=$1 AND event_id=$2::uuid`, [ADMIN_ID, EVENT_A_ID]);
  Number(kr?.cnt) >= 1 ? pass('Clean sweep key awarded for Event A') : fail('No clean sweep key');

  const [tkr] = await q(`SELECT COUNT(*) as cnt FROM user_keys WHERE user_id=$1`, [ADMIN_ID]);
  console.log(`  Total admin keys: ${tkr?.cnt}`);

  // --- Step 5: Transition Completed → Closed + Snapshot ---
  section('Step 5 — Transition Completed → Closed + Leaderboard Snapshot');
  await db.update(events).set({ status: 'Closed' }).where(eq(events.id, EVENT_A_ID));
  try {
    const snap = await createLeaderboardSnapshot('event', EVENT_A_ID);
    snap ? pass('Leaderboard snapshot created') : fail('createLeaderboardSnapshot returned falsy');
  } catch (err: any) { fail(`createLeaderboardSnapshot error: ${err.message}`); }

  const [sr] = await q(`SELECT id FROM leaderboard_snapshots WHERE event_id=$1::uuid ORDER BY created_at DESC LIMIT 1`, [EVENT_A_ID]);
  sr ? pass('Snapshot found in leaderboard_snapshots table') : fail('No snapshot row in DB');

  const [evtClosed] = await db.select({ status: events.status }).from(events).where(eq(events.id, EVENT_A_ID));
  evtClosed?.status === 'Closed' ? pass('Event status = Closed') : fail(`Event status = ${evtClosed?.status}`);

  // --- Step 6: Transition Closed → Archived ---
  section('Step 6 — Transition Closed → Archived');
  await db.update(events).set({ status: 'Archived' }).where(eq(events.id, EVENT_A_ID));
  const [evtFinal] = await db.select({ status: events.status }).from(events).where(eq(events.id, EVENT_A_ID));
  evtFinal?.status === 'Archived' ? pass('Event status = Archived') : fail(`Event status = ${evtFinal?.status}`);

  // Final verification
  section('Final State Verification');
  const finalPicks = await db.select({ isLocked: userPicks.isLocked })
    .from(userPicks).where(inArray(userPicks.fightId, fightIds));
  finalPicks.every(p => p.isLocked) ? pass('All 12 picks remain locked in Archived state') : fail('Picks not all locked');

  const [fr] = await q(`SELECT COUNT(*) as cnt FROM fight_results WHERE fight_id = ANY($1::text[])`, [fightIds]);
  Number(fr?.cnt) === 12 ? pass('12/12 fight_results created') : fail(`fight_results count = ${fr?.cnt}`);

  const [adminFinal] = await db.select({ points: users.totalPoints }).from(users).where(eq(users.id, ADMIN_ID));
  console.log(`\n  Admin final total_points: ${adminFinal?.points}`);
  console.log('\n=== T003 Complete ===\n');
  process.exit(0);
}

runTest().catch(err => { console.error('Fatal:', err); process.exit(1); });
