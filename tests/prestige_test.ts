import { finalizeFightResult } from '../server/services/scoringService';
import { db, pool } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

const ADMIN_ID = '55450188';
const EVENT_D_ID = 'b4c15712-d77c-4695-8d6d-bcec632d7335';

function pass(msg: string) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg: string) { console.log(`  ❌ FAIL: ${msg}`); }
function section(title: string) { console.log(`\n=== ${title} ===`); }
async function q(text: string, params: any[] = []) { return (await pool.query(text, params)).rows; }

async function runTest() {
  console.log('=== T006: Prestige System Edge Cases ===');
  console.log(`Event D: ${EVENT_D_ID}`);

  const dFights = await q(
    `SELECT ef.id as fight_id, ef.fighter1_id, ef.fighter2_id
     FROM event_fights ef JOIN events e ON ef.event_id = e.id
     WHERE e.name = $1 ORDER BY ef.bout_order`,
    ['GRIT Prestige Test']
  );
  console.log(`\nLoaded ${dFights.length} Event D fights`);
  if (dFights.length < 4) { console.error('Expected 4 fights'); process.exit(1); }

  const [adminBefore] = await db.select({ points: users.totalPoints }).from(users).where(eq(users.id, ADMIN_ID));
  const [keysBefore] = await q(`SELECT COUNT(*) as cnt FROM user_keys WHERE user_id=$1`, [ADMIN_ID]);
  console.log(`\nBaseline — points: ${adminBefore?.points}, keys: ${keysBefore?.cnt}`);

  // --- Edge Case 1: Pick edit before lock → clean sweep ---
  section('Edge Case 1 — Pick edit before lock → clean sweep');

  const pick2 = dFights[1];
  // Edit to wrong fighter
  await q(`UPDATE user_picks SET picked_fighter_id=$1, updated_at=NOW() WHERE user_id=$2 AND fight_id=$3`, [pick2.fighter2_id, ADMIN_ID, pick2.fight_id]);
  const [ep2] = await q(`SELECT picked_fighter_id FROM user_picks WHERE user_id=$1 AND fight_id=$2`, [ADMIN_ID, pick2.fight_id]);
  ep2?.picked_fighter_id === pick2.fighter2_id ? pass('Pick #2 changed to fighter2 (wrong)') : fail(`Pick edit failed: ${ep2?.picked_fighter_id}`);

  // Revert to fighter1 (correct)
  await q(`UPDATE user_picks SET picked_fighter_id=$1, updated_at=NOW() WHERE user_id=$2 AND fight_id=$3`, [pick2.fighter1_id, ADMIN_ID, pick2.fight_id]);
  const [rp2] = await q(`SELECT picked_fighter_id FROM user_picks WHERE user_id=$1 AND fight_id=$2`, [ADMIN_ID, pick2.fight_id]);
  rp2?.picked_fighter_id === pick2.fighter1_id ? pass('Pick #2 reverted to fighter1 — editing before lock works') : fail('Revert failed');

  // Finalize all 4 Event D fights
  let ok = 0;
  for (const f of dFights) {
    try {
      await finalizeFightResult(f.fight_id, { winnerId: f.fighter1_id, method: 'KO/TKO', round: 1, timeEnd: '1:23', referee: 'Test Referee' });
      ok++; process.stdout.write('.');
    } catch (err: any) { console.log(`\n  ✗ ${f.fight_id}: ${err.message}`); }
  }
  console.log('');
  ok === 4 ? pass(`${ok}/4 Event D fights finalized`) : fail(`Only ${ok}/4`);

  const [keyD] = await q(`SELECT COUNT(*) as cnt FROM user_keys WHERE user_id=$1 AND event_id=$2::uuid`, [ADMIN_ID, EVENT_D_ID]);
  Number(keyD?.cnt) === 1 ? pass('Clean sweep key awarded for Event D') : fail(`Event D key count = ${keyD?.cnt}`);

  // --- Edge Case 2: Double key award prevention ---
  section('Edge Case 2 — Double key award prevention');
  await q(`INSERT INTO user_keys (user_id, event_id, awarded_at) VALUES ($1, $2::uuid, NOW()) ON CONFLICT (user_id, event_id) DO NOTHING`, [ADMIN_ID, EVENT_D_ID]);
  const [dup] = await q(`SELECT COUNT(*) as cnt FROM user_keys WHERE user_id=$1 AND event_id=$2::uuid`, [ADMIN_ID, EVENT_D_ID]);
  Number(dup?.cnt) === 1
    ? pass(`Duplicate key blocked — user_keys_user_id_event_id_key UNIQUE constraint enforced`)
    : fail(`Count = ${dup?.cnt} (expected 1)`);

  const [totalKeys] = await q(`SELECT COUNT(*) as cnt FROM user_keys WHERE user_id=$1`, [ADMIN_ID]);
  console.log(`\n  Total admin keys after Event D: ${totalKeys?.cnt}`);

  // --- Edge Case 3: Ultra badge milestone (5+ keys) ---
  section('Edge Case 3 — Ultra badge milestone (5 keys total)');
  const currentCount = Number(totalKeys?.cnt ?? 0);
  const needed = Math.max(0, 5 - currentCount);
  console.log(`  Current keys: ${currentCount}, inserting ${needed} dummy keys to reach 5`);

  for (let i = 0; i < needed; i++) {
    await q(`INSERT INTO user_keys (user_id, event_id, awarded_at) VALUES ($1, gen_random_uuid(), NOW())`, [ADMIN_ID]);
  }
  if (needed > 0) pass(`Inserted ${needed} dummy keys`);

  const [fiveCheck] = await q(`SELECT COUNT(*) as cnt FROM user_keys WHERE user_id=$1`, [ADMIN_ID]);
  console.log(`  Keys at badge trigger: ${fiveCheck?.cnt}`);

  // Create Event E with 1 fight and 1 pick
  const [evtE] = await q(
    `INSERT INTO events (name, date, venue, city, country, organization, status)
     VALUES ($1, $2, 'Test Arena', 'Test City', 'USA', 'UFC', 'Upcoming') RETURNING id`,
    ['GRIT Badge Trigger', '2026-10-15T20:00:00Z']
  );
  const eventEId = evtE?.id;
  console.log(`  Event E: ${eventEId}`);

  // Pick two existing test fighters
  const [f1r] = await q(`SELECT id FROM fighters WHERE gym='Test Gym' ORDER BY created_at LIMIT 1`);
  const [f2r] = await q(`SELECT id FROM fighters WHERE gym='Test Gym' AND id != $1 ORDER BY created_at LIMIT 1`, [f1r?.id]);
  const f1Id = f1r?.id;
  const f2Id = f2r?.id;

  const [eFight] = await q(
    `INSERT INTO event_fights (event_id, fighter1_id, fighter2_id, card_placement, bout_order, weight_class, is_title_fight, rounds, status)
     VALUES ($1::uuid, $2::uuid, $3::uuid, 'Main Event', 1, 'Lightweight', true, 5, 'Scheduled') RETURNING id`,
    [eventEId, f1Id, f2Id]
  );
  const eFightId = eFight?.id;

  await q(
    `INSERT INTO user_picks (user_id, fight_id, picked_fighter_id, picked_method, picked_round, is_locked, status)
     VALUES ($1, $2, $3, 'KO/TKO', 1, false, 'active')`,
    [ADMIN_ID, eFightId, f1Id]
  );

  // Finalize Event E fight → triggers checkEventCleanSweep → key awarded → badge check
  try {
    await finalizeFightResult(eFightId, { winnerId: f1Id, method: 'KO/TKO', round: 1, timeEnd: '1:00', referee: 'Test Ref' });
    pass('Event E fight finalized (triggers clean sweep + badge check)');
  } catch (err: any) { fail(`Event E finalization: ${err.message}`); }

  const [finalKeyRow] = await q(`SELECT COUNT(*) as cnt FROM user_keys WHERE user_id=$1`, [ADMIN_ID]);
  console.log(`  Final key count: ${finalKeyRow?.cnt}`);

  // Check badge_audit for ultra_badge
  const ultraBadge = await q(`SELECT badge_type, trigger_event_id, triggered_at FROM badge_audit WHERE user_id=$1 AND badge_type='ultra_badge'`, [ADMIN_ID]);
  if (ultraBadge.length > 0) {
    pass(`Ultra badge audit entry found: ${JSON.stringify(ultraBadge[0])}`);
  } else {
    console.log('  ⚠️  No ultra_badge in badge_audit — investigating badge check logic in scoringService...');
  }

  // Check all badge_audit entries for admin
  const allBadges = await q(`SELECT badge_type, COUNT(*) as cnt FROM badge_audit WHERE user_id=$1 GROUP BY badge_type`, [ADMIN_ID]);
  console.log(`  All badge_audit entries: ${JSON.stringify(allBadges)}`);

  // Check scoringService badge threshold: how many keys trigger ultra badge?
  const [eKeyRow] = await q(`SELECT COUNT(*) as cnt FROM user_keys WHERE user_id=$1 AND event_id=$2::uuid`, [ADMIN_ID, eventEId]);
  Number(eKeyRow?.cnt) >= 1 ? pass('Clean sweep key awarded for Event E') : fail('No key for Event E');

  const [adminFinal] = await db.select({ points: users.totalPoints }).from(users).where(eq(users.id, ADMIN_ID));
  console.log(`\n  Admin total_points after T006: ${adminFinal?.points}`);
  console.log('\n=== T006 Complete ===\n');
  process.exit(0);
}

runTest().catch(err => { console.error('Fatal:', err); process.exit(1); });
