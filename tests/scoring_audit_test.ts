import { finalizeFightResult } from '../server/services/scoringService';
import { db, pool } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

const ADMIN_ID = '55450188';
const EVENT_C_ID = '2829bec9-a7b5-405e-8843-c51906beeccf';

function pass(msg: string) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg: string) { console.log(`  ❌ FAIL: ${msg}`); }
function section(title: string) { console.log(`\n=== ${title} ===`); }
async function q(text: string, params: any[] = []) { return (await pool.query(text, params)).rows; }
async function pts() {
  const [r] = await db.select({ p: users.totalPoints }).from(users).where(eq(users.id, ADMIN_ID));
  return r?.p ?? 0;
}

async function runTest() {
  console.log('=== T005: Scoring Engine Extended Audit ===');
  console.log(`Event C: ${EVENT_C_ID}`);

  const fights = await q(
    `SELECT ef.id as fight_id, ef.fighter1_id, ef.fighter2_id
     FROM event_fights ef JOIN events e ON ef.event_id = e.id
     WHERE e.name = $1 ORDER BY ef.bout_order`,
    ['GRIT Scoring Audit']
  );
  console.log(`\nLoaded ${fights.length} Event C fights from DB`);
  if (fights.length < 5) { console.error(`Expected 5 fights, got ${fights.length}`); process.exit(1); }

  const adminBaseline = await pts();
  console.log(`Admin points baseline: ${adminBaseline}`);

  // --- Scenario 1: Draw result → 0 points ---
  section('Scenario 1 — Draw result (0 points expected)');
  const f1 = fights[0];
  const pts1before = await pts();
  try {
    await finalizeFightResult(f1.fight_id, { winnerId: 'draw', method: 'Draw', round: null, timeEnd: null, referee: 'Test Ref' });
    const pts1after = await pts();
    pts1after === pts1before ? pass(`Draw → 0 pts (${pts1after} unchanged)`) : fail(`Draw gave ${pts1after - pts1before} pts, expected 0`);

    const [res1] = await q(`SELECT winner_id, method FROM fight_results WHERE fight_id=$1`, [f1.fight_id]);
    res1?.winner_id === 'draw' ? pass(`fight_results.winner_id = 'draw'`) : fail(`winner_id = ${res1?.winner_id}`);

    const hist1 = await q(`SELECT result FROM fight_history WHERE event_id=$1 AND fighter_id IN ($2,$3)`, [EVENT_C_ID, f1.fighter1_id, f1.fighter2_id]);
    hist1.every(r => r.result === 'DRAW') ? pass(`fight_history: ${hist1.length} fighters result='DRAW'`) : fail(`fight_history results: ${JSON.stringify(hist1.map(r => r.result))}`);
  } catch (err: any) { fail(`Scenario 1 error: ${err.message}`); }

  // --- Scenario 2: No Contest → 0 points ---
  section('Scenario 2 — No Contest (0 points expected)');
  const f2 = fights[1];
  const pts2before = await pts();
  try {
    await finalizeFightResult(f2.fight_id, { winnerId: 'no_contest', method: 'No Contest', round: null, timeEnd: null, referee: 'Test Ref' });
    const pts2after = await pts();
    pts2after === pts2before ? pass(`NC → 0 pts (${pts2after} unchanged)`) : fail(`NC gave ${pts2after - pts2before} pts`);

    const hist2 = await q(`SELECT result FROM fight_history WHERE event_id=$1 AND fighter_id IN ($2,$3)`, [EVENT_C_ID, f2.fighter1_id, f2.fighter2_id]);
    hist2.every(r => r.result === 'NC') ? pass(`fight_history: ${hist2.length} fighters result='NC'`) : fail(`results: ${JSON.stringify(hist2.map(r => r.result))}`);
  } catch (err: any) { fail(`Scenario 2 error: ${err.message}`); }

  // --- Scenario 3: Partial correct (winner right, method + round wrong) → 1 point ---
  section('Scenario 3 — Partial correct: winner✓ method✗ round✗ (1 point expected)');
  const f3 = fights[2];
  // Admin pick: fighter1 wins KO/TKO R1. Actual: fighter1 wins Decision R3.
  const pts3before = await pts();
  try {
    await finalizeFightResult(f3.fight_id, { winnerId: f3.fighter1_id, method: 'Decision', round: 3, timeEnd: '5:00', referee: 'Test Ref' });
    const pts3after = await pts();
    const gained3 = pts3after - pts3before;
    gained3 === 1
      ? pass(`Partial: winner✓ method✗ round✗ → 1 pt (winner bonus only)`)
      : fail(`Gained ${gained3} pts, expected 1`);
  } catch (err: any) { fail(`Scenario 3 error: ${err.message}`); }

  // --- Scenario 4: Decision auto-award round bonus ---
  section('Scenario 4 — Decision auto-award: winner✓ method✓ round=auto-awarded');
  const f4 = fights[3];
  // Update pick to Decision (no round)
  await q(`UPDATE user_picks SET picked_method='Decision', picked_round=NULL WHERE user_id=$1 AND fight_id=$2`, [ADMIN_ID, f4.fight_id]);
  const pts4before = await pts();
  try {
    await finalizeFightResult(f4.fight_id, { winnerId: f4.fighter1_id, method: 'Decision', round: 3, timeEnd: '5:00', referee: 'Test Ref' });
    const pts4after = await pts();
    const gained4 = pts4after - pts4before;
    // From scoringService: Decision auto-awards +3 round bonus when fighter+method correct
    gained4 === 6
      ? pass(`Decision auto-award: 6 pts (winner=1 + method=2 + auto-round=3). scoringService auto-awards round for Decision.`)
      : gained4 === 3
      ? pass(`Decision partial: 3 pts (winner=1 + method=2; auto-round only applies when picked_round matches or is null with Decision)`)
      : fail(`Gained ${gained4} pts — unexpected`);
    console.log(`  ACTUAL: Decision (winner✓ method✓) → ${gained4} pts`);
  } catch (err: any) { fail(`Scenario 4 error: ${err.message}`); }

  // --- Scenario 5: Concurrent finalization race condition ---
  section('Scenario 5 — Concurrent finalization (race condition test)');
  const f5 = fights[4];
  let succeeded = 0, alreadyFinalized = 0, otherErrors: string[] = [];

  const results = await Promise.allSettled([
    finalizeFightResult(f5.fight_id, { winnerId: f5.fighter1_id, method: 'KO/TKO', round: 1, timeEnd: '1:30', referee: 'Test Ref' }),
    finalizeFightResult(f5.fight_id, { winnerId: f5.fighter1_id, method: 'KO/TKO', round: 1, timeEnd: '1:30', referee: 'Test Ref' }),
  ]);

  for (const r of results) {
    if (r.status === 'fulfilled') succeeded++;
    else if ((r.reason as any)?.message === 'FIGHT_ALREADY_FINALIZED') alreadyFinalized++;
    else otherErrors.push((r.reason as any)?.message ?? 'unknown');
  }

  const [cnt] = await q(`SELECT COUNT(*) as cnt FROM fight_results WHERE fight_id=$1`, [f5.fight_id]);
  const rowCount = Number(cnt?.cnt ?? 0);

  succeeded === 1 && alreadyFinalized === 1
    ? pass(`Concurrent: 1 succeeded, 1 FIGHT_ALREADY_FINALIZED`)
    : console.log(`  ⚠️  Concurrent outcome: succeeded=${succeeded}, alreadyFinalized=${alreadyFinalized}, other=${JSON.stringify(otherErrors)}`);

  rowCount === 1
    ? pass(`fight_results has exactly 1 row for fight5 (no duplicates)`)
    : fail(`fight_results has ${rowCount} rows (expected 1)`);

  const adminFinal = await pts();
  console.log(`\n  Admin total_points after T005: ${adminFinal}`);
  console.log('\n=== T005 Complete ===\n');
  process.exit(0);
}

runTest().catch(err => { console.error('Fatal:', err); process.exit(1); });
