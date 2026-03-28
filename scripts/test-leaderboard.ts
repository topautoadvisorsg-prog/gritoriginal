/**
 * test-leaderboard.ts
 *
 * Verifies:
 *   1. POST /api/admin/leaderboard/snapshot/auto  → generates monthly snapshot
 *   2. GET  /api/leaderboard/latest/monthly       → fetches snapshot, logs rankings
 *   3. GET  /api/leaderboard/latest/yearly        → reports 404 (expected if none exist) or logs data
 *   4. GET  /api/leaderboard/history?type=monthly → verifies history endpoint still works
 *
 * Usage:
 *   npx ts-node scripts/test-leaderboard.ts
 *
 * Requires: dev server running on localhost:5000 with a valid admin session cookie.
 * Set ADMIN_SESSION env var to your session cookie string.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const SESSION_COOKIE = process.env.ADMIN_SESSION || '';

if (!SESSION_COOKIE) {
  console.warn('⚠️  ADMIN_SESSION env var not set. Admin endpoints will likely return 401.\n');
}

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  ...(SESSION_COOKIE ? { Cookie: SESSION_COOKIE } : {}),
};

async function request(method: string, path: string, body?: object) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

function pass(msg: string) { console.log(`  ✅ ${msg}`); }
function fail(msg: string) { console.error(`  ❌ ${msg}`); }
function info(msg: string) { console.log(`  ℹ️  ${msg}`); }

async function main() {
  let allPassed = true;

  // ─── 1. Generate monthly snapshot (auto) ─────────────────────────────────
  console.log('\n[1] POST /api/admin/leaderboard/snapshot/auto  (type: monthly)');
  const { status: s1, json: j1 } = await request('POST', '/api/admin/leaderboard/snapshot/auto', { type: 'monthly' });
  if (s1 === 201) {
    pass(`Snapshot created: id=${j1.id}, type=${j1.snapshotType}, rankings=${j1.rankings?.length ?? 0}`);
  } else if (s1 === 422) {
    info(`No picks found for this period (422). This is expected on an empty DB.`);
  } else if (s1 === 401) {
    fail(`Unauthorized (401). Set ADMIN_SESSION env var to a valid admin session cookie.`);
    allPassed = false;
  } else {
    fail(`Unexpected status ${s1}: ${JSON.stringify(j1)}`);
    allPassed = false;
  }

  // ─── 2. Fetch latest monthly snapshot ────────────────────────────────────
  console.log('\n[2] GET /api/leaderboard/latest/monthly');
  const { status: s2, json: j2 } = await request('GET', '/api/leaderboard/latest/monthly');
  if (s2 === 200) {
    pass(`Found snapshot: id=${j2.id}`);
    const top3 = (j2.rankings || []).slice(0, 3);
    top3.forEach((r: any, i: number) => info(`  #${r.rank ?? i + 1}  ${r.username}  netUnits=${r.netUnits}`));
    if (!Array.isArray(j2.rankings)) {
      fail('rankings field is not an array'); allPassed = false;
    }
  } else if (s2 === 404) {
    info('No monthly snapshot found (404). Generate one first via step 1.');
  } else {
    fail(`Unexpected status ${s2}: ${JSON.stringify(j2)}`);
    allPassed = false;
  }

  // ─── 3. Fetch latest yearly snapshot (likely 404) ─────────────────────────
  console.log('\n[3] GET /api/leaderboard/latest/yearly');
  const { status: s3, json: j3 } = await request('GET', '/api/leaderboard/latest/yearly');
  if (s3 === 200) {
    pass(`Found yearly snapshot: id=${j3.id}, rankings=${j3.rankings?.length ?? 0}`);
  } else if (s3 === 404) {
    pass('No yearly snapshot yet (404 expected if none generated)');
  } else {
    fail(`Unexpected status ${s3}: ${JSON.stringify(j3)}`);
    allPassed = false;
  }

  // ─── 4. Verify history endpoint ───────────────────────────────────────────
  console.log('\n[4] GET /api/leaderboard/history?type=monthly&limit=5');
  const { status: s4, json: j4 } = await request('GET', '/api/leaderboard/history?type=monthly&limit=5');
  if (s4 === 200 && Array.isArray(j4)) {
    pass(`History returned ${j4.length} snapshot(s)`);
  } else {
    fail(`Unexpected response: status=${s4}, body=${JSON.stringify(j4)}`);
    allPassed = false;
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  if (allPassed) {
    console.log('✅ All leaderboard tests passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. See output above.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
