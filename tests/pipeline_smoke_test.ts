import { pool } from "../server/db";
import { finalizeFightResult } from "../server/services/scoringService";
import { runEventProgression } from "../server/services/progressionService";
import { createLeaderboardSnapshot } from "../server/services/leaderboardService";
import { logger } from "../server/utils/logger";
import { v4 as uuidv4 } from "uuid";

type SmokeCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

const SMOKE_PREFIX = "CODY_SMOKE";
const smokeRunId = `${SMOKE_PREFIX}_${Date.now()}`;
const userId = `${smokeRunId}_USER`;
const eventId = uuidv4();
const fightCount = 10;
const fighterIds = Array.from({ length: fightCount * 2 }, () => uuidv4());
const fightIds = Array.from({ length: fightCount }, () => uuidv4());
const checks: SmokeCheck[] = [];
let notificationAttempts = 0;

function record(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
  const marker = ok ? "PASS" : "FAIL";
  console.log(`[${marker}] ${name}: ${detail}`);
}

async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await pool.query(sql, params)).rows as T[];
}

function installNotificationProbe() {
  const originalWarn = logger.warn.bind(logger);
  logger.warn = ((...args: unknown[]) => {
    if (String(args[0] ?? "").includes("OneSignal not configured")) {
      notificationAttempts += 1;
    }
    originalWarn(...args);
  }) as typeof logger.warn;

  return () => {
    logger.warn = originalWarn as typeof logger.warn;
  };
}

async function cleanup() {
  await query(
    `
      DELETE FROM badge_audit
      WHERE user_id = $1 OR trigger_event_id = $2::uuid
    `,
    [userId, eventId],
  );
  await query(
    `
      DELETE FROM user_keys
      WHERE user_id = $1 OR event_id = $2::uuid
    `,
    [userId, eventId],
  );
  await query(
    `
      DELETE FROM leaderboard_snapshots
      WHERE event_id = $1::uuid
    `,
    [eventId],
  );
  await query(
    `
      DELETE FROM fight_history
      WHERE event_id = $1::uuid
    `,
    [eventId],
  );
  await query(
    `
      DELETE FROM fight_results
      WHERE fight_id IN (
        SELECT id::text FROM event_fights WHERE event_id = $1::uuid
      )
    `,
    [eventId],
  );
  await query(
    `
      DELETE FROM user_picks
      WHERE user_id = $1
         OR fight_id IN (
           SELECT id::text FROM event_fights WHERE event_id = $2::uuid
         )
    `,
    [userId, eventId],
  );
  await query(`DELETE FROM event_fights WHERE event_id = $1::uuid`, [eventId]);
  await query(`DELETE FROM events WHERE id = $1::uuid OR name LIKE $2`, [eventId, `${SMOKE_PREFIX}%`]);
  await query(`DELETE FROM users WHERE id = $1 OR email LIKE $2`, [userId, `${SMOKE_PREFIX}%`]);
  await query(`DELETE FROM fighters WHERE first_name = $1`, [SMOKE_PREFIX]);
}

async function seedSmokeData() {
  await query(
    `
      INSERT INTO users (
        id, email, first_name, last_name, username, role, tier,
        total_points, star_level, progress_badge, current_streak, max_streak
      )
      VALUES ($1, $2, 'Cody', 'Smoke', $3, 'user', 'free', 0, 0, 'none', 0, 0)
    `,
    [userId, `${smokeRunId}@example.test`, smokeRunId.toLowerCase()],
  );

  for (let i = 0; i < fighterIds.length; i += 1) {
    await query(
      `
        INSERT INTO fighters (
          id, first_name, last_name, nationality, gender, weight_class,
          image_url, organization, record, performance
        )
        VALUES (
          $1::uuid, $2, $3, 'USA', 'male', 'Lightweight',
          'https://example.test/fighter.png', 'UFC',
          '{"wins":0,"losses":0,"draws":0,"noContests":0}'::jsonb,
          '{}'::jsonb
        )
      `,
      [fighterIds[i], SMOKE_PREFIX, `${smokeRunId}_F${i + 1}`],
    );
  }

  await query(
    `
      INSERT INTO events (
        id, name, date, venue, city, state, country, organization, status, lock_time
      )
      VALUES (
        $1::uuid, $2, NOW() + INTERVAL '7 days',
        'Smoke Arena', 'San Diego', 'CA', 'USA', 'UFC', 'Upcoming',
        NOW() + INTERVAL '7 days'
      )
    `,
    [eventId, `${SMOKE_PREFIX} Event ${smokeRunId}`],
  );

  for (let i = 0; i < fightCount; i += 1) {
    const fighter1Id = fighterIds[i * 2];
    const fighter2Id = fighterIds[i * 2 + 1];
    await query(
      `
        INSERT INTO event_fights (
          id, event_id, fighter1_id, fighter2_id, card_placement,
          bout_order, weight_class, rounds, status, odds
        )
        VALUES (
          $1::uuid, $2::uuid, $3::uuid, $4::uuid, 'Main Card',
          $5, 'Lightweight', 3, 'OPEN',
          '{"fighter1Odds":"+100","fighter2Odds":"-120","source":"smoke"}'::jsonb
        )
      `,
      [fightIds[i], eventId, fighter1Id, fighter2Id, i + 1],
    );

    await query(
      `
        INSERT INTO user_picks (
          user_id, fight_id, picked_fighter_id, picked_method, picked_round,
          units, locked_odds, points_awarded, is_locked, status, confidence_flag
        )
        VALUES ($1, $2, $3, 'KO/TKO', 1, 1, '+100', 0, false, 'active', 'none')
      `,
      [userId, fightIds[i], fighter1Id],
    );
  }
}

async function runSmoke() {
  const restoreLogger = installNotificationProbe();

  try {
    console.log(`\n=== GRIT Pipeline Smoke Test (${smokeRunId}) ===\n`);
    await cleanup();
    await seedSmokeData();

    const [seededEvent] = await query<{ fight_count: string; pick_count: string }>(
      `
        SELECT
          (SELECT COUNT(*) FROM event_fights WHERE event_id = $1::uuid) AS fight_count,
          (SELECT COUNT(*) FROM user_picks WHERE user_id = $2) AS pick_count
      `,
      [eventId, userId],
    );
    record(
      "seed test fighter/event/picks",
      Number(seededEvent?.fight_count) === fightCount && Number(seededEvent?.pick_count) === fightCount,
      `${seededEvent?.fight_count} fights, ${seededEvent?.pick_count} picks`,
    );

    await query(`UPDATE events SET status = 'Live' WHERE id = $1::uuid`, [eventId]);

    for (let i = 0; i < fightCount; i += 1) {
      await finalizeFightResult(fightIds[i], {
        winnerId: fighterIds[i * 2],
        method: "KO/TKO",
        round: 1,
        time: "1:23",
        timeEnd: "1:23",
        referee: "Cody Smoke",
      });
    }

    const [scored] = await query<{ result_count: string; point_sum: string; total_points: number }>(
      `
        SELECT
          (SELECT COUNT(*) FROM fight_results WHERE fight_id = ANY($1::text[])) AS result_count,
          (SELECT COALESCE(SUM(points_awarded), 0) FROM user_picks WHERE user_id = $2) AS point_sum,
          (SELECT total_points FROM users WHERE id = $2) AS total_points
      `,
      [fightIds, userId],
    );
    record(
      "admin result finalization + scoring",
      Number(scored?.result_count) === fightCount &&
        Number(scored?.point_sum) === 1000 &&
        Number(scored?.total_points) === 1000,
      `${scored?.result_count} results, ${scored?.point_sum} net-unit score, user.total_points=${scored?.total_points}`,
    );

    const [history] = await query<{ history_count: string; completed_fights: string }>(
      `
        SELECT
          (SELECT COUNT(*) FROM fight_history WHERE event_id = $1::uuid) AS history_count,
          (SELECT COUNT(*) FROM event_fights WHERE event_id = $1::uuid AND status = 'Completed') AS completed_fights
      `,
      [eventId],
    );
    record(
      "fight history + fight state updates",
      Number(history?.history_count) === fightCount * 2 && Number(history?.completed_fights) === fightCount,
      `${history?.history_count} fight_history rows, ${history?.completed_fights} completed fights`,
    );

    const [keys] = await query<{ key_count: string }>(
      `SELECT COUNT(*) AS key_count FROM user_keys WHERE user_id = $1 AND event_id = $2::uuid`,
      [userId, eventId],
    );
    record(
      "clean sweep key award",
      Number(keys?.key_count) === 1,
      `${keys?.key_count} key rows for smoke event`,
    );

    await query(`UPDATE events SET status = 'Closed' WHERE id = $1::uuid`, [eventId]);
    const progression = await runEventProgression(eventId);
    const [userAfterProgression] = await query<{ star_level: number; progress_badge: string; current_streak: number }>(
      `SELECT star_level, progress_badge, current_streak FROM users WHERE id = $1`,
      [userId],
    );
    record(
      "event progression run",
      progression.length === 1 && Number(userAfterProgression?.star_level) > 0,
      `results=${progression.length}, stars=${userAfterProgression?.star_level}, badge=${userAfterProgression?.progress_badge}, streak=${userAfterProgression?.current_streak}`,
    );

    try {
      const snapshot = await createLeaderboardSnapshot("event", eventId);
      const [snapshots] = await query<{ snapshot_count: string }>(
        `SELECT COUNT(*) AS snapshot_count FROM leaderboard_snapshots WHERE event_id = $1::uuid`,
        [eventId],
      );
      record(
        "leaderboard snapshot",
        Boolean(snapshot) && Number(snapshots?.snapshot_count) >= 1,
        `${snapshots?.snapshot_count} snapshot rows`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      record("leaderboard snapshot", false, message);
    }

    record(
      "notification path invoked",
      notificationAttempts >= 1,
      `${notificationAttempts} OneSignal skip(s) captured through notification service`,
    );

    const failed = checks.filter((check) => !check.ok);
    console.log("\n=== Smoke Summary ===");
    console.log(`${checks.length - failed.length}/${checks.length} checks passed`);

    if (failed.length > 0) {
      for (const check of failed) {
        console.log(`FAILED: ${check.name} - ${check.detail}`);
      }
      process.exitCode = 1;
    }
  } finally {
    restoreLogger();
    await cleanup();
    await pool.end();
  }
}

runSmoke().catch(async (error) => {
  console.error("Fatal smoke test error:", error);
  process.exit(1);
});
