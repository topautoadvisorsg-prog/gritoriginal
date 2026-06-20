import type { Express, NextFunction, Request, Response } from 'express';

const firstNames = ['Alex', 'Mateo', 'Rafael', 'Darius', 'Kenji', 'Omar', 'Nikolai', 'Thiago', 'Marcus', 'Eli', 'Andre', 'Luis', 'Diego', 'Ibrahim', 'Jonas', 'Victor', 'Renato', 'Caleb', 'Mason', 'Jae', 'Paulo', 'Arman', 'Stefan', 'Khalil'];
const lastNames = ['Stone', 'Rivera', 'Nascimento', 'Washington-Jones', 'Tanaka', 'Haddad', 'Volkov', 'Silva', 'Reed', 'Thompson', 'Costa', 'Morales', 'Santos', 'Diallo', 'Berg', 'Petrov', 'Almeida', 'Price', 'Cole', 'Park', 'Rocha', 'Sargsyan', 'Novak', 'Rahman'];
const countries = ['US', 'MX', 'BR', 'US', 'JP', 'AE', 'RU', 'BR'];
const portraitIds = ['photo-1560250097-0b93528c311a', 'photo-1500648767791-00dcc994a43e', 'photo-1506794778202-cad84cf45f1d', 'photo-1534528741775-53994a69daeb'];

const fighters = firstNames.map((firstName, index) => ({
  id: `audit-fighter-${String(index + 1).padStart(2, '0')}`,
  firstName,
  lastName: lastNames[index],
  nickname: index === 3 ? 'The Relentless Technician' : null,
  country: countries[index % countries.length],
  organization: 'UFC',
  weightClass: ['Lightweight', 'Welterweight', 'Featherweight', 'Bantamweight'][index % 4],
  imageUrl: index === 22 ? 'https://invalid.example.test/image-failure.jpg' : `https://images.unsplash.com/${portraitIds[index % portraitIds.length]}?auto=format&fit=crop&w=700&q=80`,
  profileImageUrl: `https://images.unsplash.com/${portraitIds[index % portraitIds.length]}?auto=format&fit=crop&w=240&h=240&q=80`,
  record: { wins: 8 + index, losses: index % 6, draws: index % 5 === 0 ? 1 : 0 },
  physicalStats: index % 6 === 0 ? {} : { age: 25 + (index % 11), height: `5'${7 + index % 5}\"`, reach: `${68 + index % 10}\"` },
  performance: {}, notes: [], riskSignals: [], isActive: true, status: 'active', isVerified: true,
}));

const fights = Array.from({ length: 12 }, (_, index) => ({
  id: `audit-fight-${String(index + 1).padStart(2, '0')}`,
  eventId: 'audit-event', fighter1Id: fighters[index * 2].id, fighter2Id: fighters[index * 2 + 1].id,
  cardPlacement: index < 5 ? 'main-card' : index < 9 ? 'prelims' : 'early-prelims', boutOrder: index + 1,
  weightClass: fighters[index * 2].weightClass, isTitleFight: index === 0, rounds: index === 0 ? 5 : 3,
  status: index < 3 ? 'CLOSED' : 'OPEN', scheduledTime: `${18 + Math.floor(index / 2)}:${index % 2 ? '30' : '00'}`,
  odds: { fighter1Odds: index % 2 ? '+135' : '-165', fighter2Odds: index % 2 ? '-155' : '+145', source: 'Audit fixture' },
  winnerId: index < 3 ? fighters[index * 2].id : null,
  fighter1Result: index < 3 ? 'WIN' : null, fighter2Result: index < 3 ? 'LOSS' : null,
}));

const event = {
  id: 'audit-event', name: 'GRIT Championship Night: Rivera vs. Washington-Jones', date: '2026-07-18T19:00:00.000Z',
  lockTime: '2026-07-18T18:55:00.000Z', venue: 'T-Mobile Arena', city: 'Las Vegas', state: 'NV', country: 'US',
  organization: 'UFC', description: 'Local visual-audit fixture. No production data.',
  imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=80', status: 'ready', fights,
};

const leaderboard = Array.from({ length: 25 }, (_, index) => ({
  rank: index + 1, id: index === 2 ? 'audit-user-03' : `audit-user-${String(index + 1).padStart(2, '0')}`,
  username: index === 2 ? 'jordan_rivera' : `fightiq_${String(index + 1).padStart(2, '0')}`,
  displayName: index === 2 ? 'jordan_rivera' : `fightiq_${String(index + 1).padStart(2, '0')}`,
  avatarUrl: `https://images.unsplash.com/${portraitIds[index % portraitIds.length]}?auto=format&fit=crop&w=160&h=160&q=75`,
  totalPoints: 985 - index * 100, country: index === 2 ? 'MX' : countries[index % countries.length], hasGoldBadge: index === 0,
}));

const picks = fights.slice(0, 9).map((fight, index) => ({
  id: `audit-pick-${index + 1}`, userId: 'audit-user-03', fightId: fight.id,
  pickedFighterId: index % 2 ? fight.fighter2Id : fight.fighter1Id, pickedMethod: index % 3 ? 'Decision' : 'KO/TKO',
  pickedRound: index % 3 + 1, units: 1, lockedOdds: index % 2 ? '+135' : '-165', pointsAwarded: index < 3 ? 65 : 0,
  isLocked: index < 3, status: 'active', confidenceFlag: index === 4 ? 'red' : index === 5 ? 'yellow' : 'none',
}));

const news = Array.from({ length: 6 }, (_, index) => ({
  id: `audit-news-${index + 1}`, title: ['Five Matchups That Define Championship Night', 'Late Camp Update From Las Vegas', 'Tactical Film Room: Southpaw Entries', 'Official Weigh-In Results', 'What The Odds Movement Means', 'Three Prospects Ready To Break Through'][index],
  excerpt: 'Fixture editorial copy for visual QA, including realistic wrapping and card density.', content: 'Local audit fixture article.',
  imageUrl: `https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=900&q=${80 - index}`,
  status: 'published', publishedAt: `2026-07-${String(12 + index).padStart(2, '0')}T12:00:00.000Z`, tags: ['Analysis'],
}));

const fixtureUser = { id: 'audit-user-03', email: 'long.audit.address@example.test', username: 'jordan_rivera', firstName: 'Jordan', lastName: 'Rivera', country: 'MX', role: 'admin', tier: 'premium', totalPoints: 785, currentStreak: 5, avatarUrl: null, profileImageUrl: null, privacySettings: { showAvatar: true, showSocialLinks: true, showUsername: true }, socialLinks: {}, permissions: [] };

export function registerUiAuditFixtures(app: Express): void {
  if (process.env.UI_AUDIT_FIXTURES !== '1') return;

  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).json({ error: 'UI audit fixtures are read-only.' });
    const path = req.path;
    if (path === '/me') return res.json(fixtureUser);
    if (path === '/events') return res.json([event]);
    if (path === '/events/audit-event') return res.json(event);
    if (path === '/fighters') return res.json(fighters);
    if (path.startsWith('/fighters/')) return res.json(fighters.find((fighter) => fighter.id === path.split('/')[2]) || fighters[0]);
    if (path === '/leaderboard') return res.json({ leaderboard, maxPoints: leaderboard[0].totalPoints });
    if (path.startsWith('/leaderboard/latest/')) return res.json({ rankings: leaderboard.map((entry) => ({ rank: entry.rank, userId: entry.id, username: entry.username, netUnits: entry.totalPoints / 100, currentStreak: entry.rank % 4 })) });
    if (path === '/news') return res.json(news);
    if (path.startsWith('/news/')) return res.json(news.find((article) => article.id === path.split('/')[2]) || news[0]);
    if (path === '/picks' || path.startsWith('/picks/event/')) return res.json(picks);
    next();
  });
}
