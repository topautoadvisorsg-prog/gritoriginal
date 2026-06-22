import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { adminNavItems } from '../../src/shared/config/navigation';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('tab-to-backend contracts', () => {
  it('maps every dynamic admin navigation tab to a component', () => {
    const adminPanel = source('src/admin/AdminPanel.tsx');
    const dynamicNavIds = adminNavItems
      .map((item) => item.id)
      .filter((id) => id !== 'fight-cards');

    for (const id of dynamicNavIds) {
      expect(adminPanel).toContain(`'${id}':`);
    }
  });

  it('uses mounted fighter-tag endpoints and replacement payloads', () => {
    const contents = source('src/admin/components/AdminTagManager.tsx');
    expect(contents).not.toContain('/api/tags/fighter/');
    expect(contents).toContain('/api/fighters/${selectedFighter!.id}/tags');
    expect(contents).toContain('JSON.stringify({ tags })');
  });

  it('loads odds from mounted event detail instead of a dead fights endpoint', () => {
    const contents = source('src/admin/components/AdminOddsEditor.tsx');
    expect(contents).toContain('fetch(`/api/events/${selectedEventId}`)');
    expect(contents).toContain('return event.fights ?? []');
  });

  it('keeps reward operations read-only while the payout system is blocked', () => {
    const contents = source('src/admin/components/AdminRaffleManager.tsx');
    expect(contents).not.toContain("method: 'POST'");
    expect(contents).not.toContain('/api/admin/raffle/allocate');
    expect(contents).toContain('Reward operations are read-only');
  });

  it('loads AI fight selection from mounted event and fighter APIs', () => {
    const contents = source('src/user/components/ai/AIPredictionsTab.tsx');
    expect(contents).toContain("fetch('/api/events')");
    expect(contents).toContain("fetch('/api/fighters')");
    expect(contents).toContain("use-auth-clerk");
  });
});
