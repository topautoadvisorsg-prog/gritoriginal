import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EventResponseSchema } from '../../src/user/api/schemas';

describe('UI audit fixture contracts', () => {
  it('accepts stable opaque identifiers from isolated providers', () => {
    expect(() => EventResponseSchema.parse({
      id: 'audit-event',
      name: 'Audit Event',
      date: '2026-07-18T19:00:00.000Z',
      venue: 'Audit Arena',
      city: 'Las Vegas',
      state: 'NV',
      country: 'US',
      organization: 'UFC',
      status: 'Live',
      fights: [{
        id: 'audit-fight-01',
        eventId: 'audit-event',
        fighter1Id: 'audit-fighter-01',
        fighter2Id: 'audit-fighter-02',
        cardPlacement: 'Main Event',
        boutOrder: 1,
        weightClass: 'Lightweight',
        isTitleFight: true,
        rounds: 5,
        status: 'OPEN',
      }],
    })).not.toThrow();
  });

  it('keeps the cross-screen fixture endpoints and in-memory writes mounted', () => {
    const fixtureSource = readFileSync(
      resolve(process.cwd(), 'server/fixtures/uiAuditFixtures.ts'),
      'utf8',
    );

    for (const endpoint of [
      "path.startsWith('/events/')",
      "path === '/events/completed'",
      "path === '/fights/results'",
      "path.startsWith('/news/fighter/')",
      "path === '/me/dashboard'",
      "path === '/me/stats'",
      "path === '/picks' && req.method === 'POST'",
      "path === '/groups' && req.method === 'POST'",
    ]) {
      expect(fixtureSource).toContain(endpoint);
    }

    expect(fixtureSource).toContain('const upcomingEvents = [');
    expect(fixtureSource).toContain("buildUpcomingEvent('audit-event-02'");
    expect(fixtureSource).toContain("buildUpcomingEvent('audit-event-03'");
    expect(fixtureSource).toContain('/^\\/fighters\\/[^/]+\\/tags$/.test(path)');
  });

  it('normalizes event status and exposes fighter cards to keyboards', () => {
    const eventHeader = readFileSync(
      resolve(process.cwd(), 'src/user/components/event/EventHeader.tsx'),
      'utf8',
    );
    const fighterCard = readFileSync(
      resolve(process.cwd(), 'src/user/components/fighter/FighterCard.tsx'),
      'utf8',
    );

    expect(eventHeader).toContain("String(event.status).toLowerCase()");
    expect(fighterCard).toContain('role="button"');
    expect(fighterCard).toContain("event.key === 'Enter'");
  });

  it('routes personal history separately from global rankings', () => {
    const appSource = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');
    const dashboardSource = readFileSync(
      resolve(process.cwd(), 'src/user/components/dashboard/Dashboard.tsx'),
      'utf8',
    );
    const historySource = readFileSync(
      resolve(process.cwd(), 'src/user/components/eventhistory/EventHistoryPage.tsx'),
      'utf8',
    );

    expect(appSource).toContain('path="history" element={<EventHistoryPage />}');
    expect(dashboardSource).toContain('<Link to="/history"');
    expect(historySource).toContain('Net Units');
    expect(historySource).not.toContain('points earned');
  });

  it('centers the nearest event and makes cards native controls', () => {
    const eventList = readFileSync(
      resolve(process.cwd(), 'src/user/components/event/EventListPage.tsx'),
      'utf8',
    );
    const userServer = readFileSync(resolve(process.cwd(), 'server/user-server.ts'), 'utf8');

    expect(eventList).toContain('return [upcoming[1], upcoming[0], ...upcoming.slice(2), ...past]');
    expect(eventList).toContain('type="button"');
    expect(eventList).toContain('aria-label={`Open ${event.name}`}');
    expect(userServer).toContain('UI audit fixture mode: database seeds, cron tasks, and job queue disabled');
  });

  it('normalizes sparse fighter metrics before rendering profiles', () => {
    const fighterContext = readFileSync(
      resolve(process.cwd(), 'src/shared/context/FighterDataContext.tsx'),
      'utf8',
    );

    expect(fighterContext).toContain('const EMPTY_PERFORMANCE = {');
    expect(fighterContext).toContain('performance: { ...EMPTY_PERFORMANCE, ...(dbRecord.performance || {}) }');
    expect(fighterContext).toContain('noContests: dbRecord.record?.noContests ?? 0');
  });
});
