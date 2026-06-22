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
      "path === '/events/audit-event'",
      "path === '/me/dashboard'",
      "path === '/me/stats'",
      "path === '/picks' && req.method === 'POST'",
      "path === '/groups' && req.method === 'POST'",
    ]) {
      expect(fixtureSource).toContain(endpoint);
    }
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
});
