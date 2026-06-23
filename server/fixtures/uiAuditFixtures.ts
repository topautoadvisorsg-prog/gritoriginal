import type { Express, NextFunction, Request, Response } from 'express';

const firstNames = ['Alex', 'Mateo', 'Rafael', 'Darius', 'Kenji', 'Omar', 'Nikolai', 'Thiago', 'Marcus', 'Eli', 'Andre', 'Luis', 'Diego', 'Ibrahim', 'Jonas', 'Victor', 'Renato', 'Caleb', 'Mason', 'Jae', 'Paulo', 'Arman', 'Stefan', 'Khalil'];
const lastNames = ['Stone', 'Rivera', 'Nascimento', 'Washington-Jones', 'Tanaka', 'Haddad', 'Volkov', 'Silva', 'Reed', 'Thompson', 'Costa', 'Morales', 'Santos', 'Diallo', 'Berg', 'Petrov', 'Almeida', 'Price', 'Cole', 'Park', 'Rocha', 'Sargsyan', 'Novak', 'Rahman'];
const countries = ['US', 'MX', 'BR', 'US', 'JP', 'AE', 'RU', 'BR'];
const portraitIds = ['photo-1560250097-0b93528c311a', 'photo-1500648767791-00dcc994a43e', 'photo-1506794778202-cad84cf45f1d', 'photo-1534528741775-53994a69daeb'];

const fighters = firstNames.map((generatedFirstName, index) => {
  const featuredIdentity = index === 0
    ? { firstName: 'Mateo', lastName: 'Rivera', nickname: 'El Fuego', bodyImageUrl: '/fixtures/fighters/mateo-rivera.jpg' }
    : index === 1
      ? { firstName: 'Darius', lastName: 'Washington', nickname: 'Blackout', bodyImageUrl: '/fixtures/fighters/darius-washington.jpg' }
      : { firstName: generatedFirstName, lastName: lastNames[index], nickname: index === 3 ? 'The Relentless Technician' : null, bodyImageUrl: undefined };

  return ({
  id: `audit-fighter-${String(index + 1).padStart(2, '0')}`,
  ...featuredIdentity,
  country: countries[index % countries.length],
  organization: 'UFC',
  weightClass: ['Lightweight', 'Welterweight', 'Featherweight', 'Bantamweight'][Math.floor(index / 2) % 4],
  imageUrl: index === 22 ? 'https://invalid.example.test/image-failure.jpg' : `https://images.unsplash.com/${portraitIds[index % portraitIds.length]}?auto=format&fit=crop&w=700&q=80`,
  profileImageUrl: `https://images.unsplash.com/${portraitIds[index % portraitIds.length]}?auto=format&fit=crop&w=240&h=240&q=80`,
  record: { wins: 8 + index, losses: index % 6, draws: index % 5 === 0 ? 1 : 0 },
  physicalStats: index % 6 === 0 ? {} : { age: 25 + (index % 11), height: `5'${7 + index % 5}"`, reach: `${68 + index % 10}"` },
  performance: {}, notes: [], riskSignals: [], isActive: true, status: 'active', isVerified: true,
  ranking: Math.floor(index / 8) * 2 + (index % 2) + 1,
  isChampion: index < 8 && index % 2 === 0,
  });
});

const fights = Array.from({ length: 12 }, (_, index) => ({
  id: `audit-fight-${String(index + 1).padStart(2, '0')}`,
  eventId: 'audit-event', fighter1Id: fighters[index * 2].id, fighter2Id: fighters[index * 2 + 1].id,
  cardPlacement: index === 0 ? 'Main Event' : index < 5 ? 'Main Card' : index < 9 ? 'Prelim' : 'Early Prelim', boutOrder: index + 1,
  weightClass: fighters[index * 2].weightClass, isTitleFight: index === 0, rounds: index === 0 ? 5 : 3,
  status: 'OPEN', scheduledTime: `${18 + Math.floor(index / 2)}:${index % 2 ? '30' : '00'}`,
  odds: { fighter1Odds: index % 2 ? '+135' : '-165', fighter2Odds: index % 2 ? '-155' : '+145', source: 'Audit fixture' },
  winnerId: null,
  fighter1Result: null, fighter2Result: null,
}));

const event = {
  id: 'audit-event', name: 'GRIT Championship Night: Rivera vs. Washington', date: '2026-07-18T19:00:00.000Z',
  lockTime: '2026-07-18T18:55:00.000Z', venue: 'T-Mobile Arena', city: 'Las Vegas', state: 'NV', country: 'US',
  organization: 'UFC', description: 'Local visual-audit fixture. No production data.',
  imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=80', status: 'Upcoming', fights,
};

function buildUpcomingEvent(id: string, name: string, date: string, fighterOffset: number, venue: string, city: string) {
  const eventFights = fights.map((fight, index) => ({
    ...fight,
    id: `${id}-fight-${String(index + 1).padStart(2, '0')}`,
    eventId: id,
    fighter1Id: fighters[(index * 2 + fighterOffset) % fighters.length].id,
    fighter2Id: fighters[(index * 2 + fighterOffset + 1) % fighters.length].id,
    status: 'OPEN',
    winnerId: null,
    fighter1Result: null,
    fighter2Result: null,
  }));

  return {
    ...event,
    id,
    name,
    date,
    lockTime: date,
    venue,
    city,
    status: 'Upcoming',
    fights: eventFights,
  };
}

const upcomingEvents = [
  event,
  buildUpcomingEvent('audit-event-02', 'GRIT Fight Night: Nascimento vs. Washington-Jones', '2026-08-01T19:00:00.000Z', 2, 'Madison Square Garden', 'New York'),
  buildUpcomingEvent('audit-event-03', 'GRIT International: Tanaka vs. Haddad', '2026-08-15T10:00:00.000Z', 4, 'Saitama Super Arena', 'Saitama'),
];

const completedFights = fights.slice(0, 4).map((fight, index) => ({
  ...fight,
  id: `audit-history-fight-${index + 1}`,
  eventId: 'audit-completed-event',
  status: 'CLOSED',
  winnerId: index % 2 === 0 ? fight.fighter1Id : fight.fighter2Id,
}));

const completedEvent = {
  ...event,
  id: 'audit-completed-event',
  name: 'GRIT Fight Night 01: Settled Card',
  date: '2026-05-30T19:00:00.000Z',
  status: 'Completed',
  fights: completedFights,
  createdAt: '2026-05-01T12:00:00.000Z',
};

const completedResults = completedFights.map((fight, index) => ({
  id: `audit-result-${index + 1}`,
  fightId: fight.id,
  winnerId: fight.winnerId,
  method: index % 2 === 0 ? 'Decision' : 'KO/TKO',
  methodDetail: null,
  round: index % 2 === 0 ? 3 : 2,
  time: index % 2 === 0 ? '5:00' : '3:42',
  referee: 'Audit Official',
}));

const completedPicks = completedFights.map((fight, index) => ({
  id: `audit-history-pick-${index + 1}`,
  userId: 'audit-user-03',
  fightId: fight.id,
  pickedFighterId: index === 3 ? fight.fighter1Id : fight.winnerId,
  pickedMethod: index % 2 === 0 ? 'Decision' : 'KO/TKO',
  pickedRound: index % 2 === 0 ? 3 : 2,
  units: 1,
  lockedOdds: '-110',
  pointsAwarded: index === 3 ? -100 : 91,
  isLocked: true,
  status: 'active',
  confidenceFlag: 'none',
}));

const chatMessages = [
  { id: 'audit-chat-01', userId: 'audit-user-01', eventId: 'audit-event', chatType: 'global', countryCode: 'US', message: 'Rivera is finding the body early. That left hook is open.', messageType: 'text', createdAt: '2026-07-18T19:12:00.000Z', user: { username: 'fightiq_01', displayName: 'FightIQ', avatarUrl: null, rank: 'GRANDMASTER', progressBadge: 'master' } },
  { id: 'audit-chat-02', userId: 'audit-user-03', eventId: 'audit-event', chatType: 'global', countryCode: 'MX', message: 'Washington needs to stop backing straight into the fence.', messageType: 'text', createdAt: '2026-07-18T19:12:20.000Z', user: { username: 'jordan_rivera', displayName: 'Jordan Rivera', avatarUrl: null, rank: 'MASTER', progressBadge: 'samurai' } },
  { id: 'audit-chat-03', userId: 'audit-admin', eventId: 'audit-event', chatType: 'global', countryCode: null, message: 'Keep it respectful. Debate the fight, not each other.', messageType: 'text', createdAt: '2026-07-18T19:11:30.000Z', isAdmin: true, user: { username: 'GRIT', displayName: 'GRIT' } },
  { id: 'audit-chat-04', userId: 'audit-user-04', eventId: 'audit-event', chatType: 'country', countryCode: 'MX', message: 'Vamos Mateo. Pressure and body work all night.', messageType: 'text', createdAt: '2026-07-18T19:12:40.000Z', user: { username: 'mx_fight_club', displayName: 'MX Fight Club', avatarUrl: null, rank: 'SAMURAI', progressBadge: 'ninja' } },
];

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
  pickedRound: index % 3 + 1, units: 1, lockedOdds: index % 2 ? '+135' : '-165', pointsAwarded: 0,
  isLocked: false, status: 'active', confidenceFlag: index === 4 ? 'red' : index === 5 ? 'yellow' : 'none',
}));

const news = Array.from({ length: 6 }, (_, index) => ({
  id: `audit-news-${index + 1}`, title: ['Five Matchups That Define Championship Night', 'Late Camp Update From Las Vegas', 'Tactical Film Room: Southpaw Entries', 'Official Weigh-In Results', 'What The Odds Movement Means', 'Three Prospects Ready To Break Through'][index],
  excerpt: 'Fixture editorial copy for visual QA, including realistic wrapping and card density.', content: 'Local audit fixture article.',
  imageUrl: `https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=900&q=${80 - index}`,
  status: 'published', publishedAt: `2026-07-${String(12 + index).padStart(2, '0')}T12:00:00.000Z`, tags: ['Analysis'],
}));

const fixtureUser = { id: 'audit-user-03', email: 'long.audit.address@example.test', username: 'jordan_rivera', firstName: 'Jordan', lastName: 'Rivera', country: 'MX', role: 'admin', tier: 'premium', totalPoints: 785, currentStreak: 5, avatarUrl: null, profileImageUrl: null, privacySettings: { showAvatar: true, showSocialLinks: true, showUsername: true }, socialLinks: {}, permissions: [] };

interface FixtureGroup {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  isPrivate: boolean;
  maxMembers: number;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    groupId: string;
    userId: string;
    role: 'owner';
    joinedAt: string;
    username: string;
    avatarUrl: string | null;
    netUnits: number;
  }>;
}

interface FixtureGroupMessage {
  id: string;
  groupId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

const fixtureGroups: FixtureGroup[] = [];
const fixtureGroupMessages: Record<string, FixtureGroupMessage[]> = {};

function buildFixtureGroup(name: string, description: string | undefined, isPrivate: boolean): FixtureGroup {
  const id = `audit-group-${fixtureGroups.length + 1}`;
  return {
    id,
    name,
    description: description || '',
    ownerId: fixtureUser.id,
    isPrivate,
    maxMembers: 50,
    memberCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [{
      id: `${id}-member-1`,
      groupId: id,
      userId: fixtureUser.id,
      role: 'owner',
      joinedAt: new Date().toISOString(),
      username: fixtureUser.username,
      avatarUrl: fixtureUser.avatarUrl,
      netUnits: 7.8,
    }],
  };
}

export function registerUiAuditFixtures(app: Express): void {
  if (process.env.UI_AUDIT_FIXTURES !== '1') return;

  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    if (path === '/chat' && req.method === 'POST') {
      const message = String(req.body?.message || '').trim();
      if (!message) return res.status(400).json({ error: 'Message is required.' });
      const created = {
        id: `audit-chat-local-${Date.now()}`,
        userId: fixtureUser.id,
        eventId: 'audit-event',
        chatType: req.body?.chatType === 'country' ? 'country' : 'global',
        countryCode: req.body?.chatType === 'country' ? fixtureUser.country : null,
        message,
        messageType: 'text',
        createdAt: new Date().toISOString(),
        user: { username: fixtureUser.username, displayName: fixtureUser.username, avatarUrl: null, rank: 'MASTER', progressBadge: 'master' },
      };
      chatMessages.unshift(created);
      return res.status(201).json(created);
    }
    if (path === '/picks' && req.method === 'POST') {
      const fight = fights.find(candidate => candidate.id === req.body?.fightId);
      if (!fight) return res.status(404).json({ message: 'Fight not found.' });
      const existingIndex = picks.findIndex(candidate => candidate.fightId === fight.id);
      if (existingIndex >= 0 && picks[existingIndex].isLocked) {
        return res.status(409).json({ message: 'This pick is locked.' });
      }
      const saved = {
        ...(existingIndex >= 0 ? picks[existingIndex] : {}),
        id: existingIndex >= 0 ? picks[existingIndex].id : `audit-pick-${picks.length + 1}`,
        userId: fixtureUser.id,
        fightId: fight.id,
        pickedFighterId: req.body?.pickedFighterId,
        pickedMethod: req.body?.pickedMethod || 'Decision',
        pickedRound: req.body?.pickedRound ?? null,
        units: 1,
        lockedOdds: req.body?.pickedFighterId === fight.fighter1Id ? fight.odds.fighter1Odds : fight.odds.fighter2Odds,
        pointsAwarded: 0,
        isLocked: false,
        status: 'active',
        confidenceFlag: 'none',
      };
      if (existingIndex >= 0) picks[existingIndex] = saved;
      else picks.push(saved);
      return res.status(existingIndex >= 0 ? 200 : 201).json(saved);
    }
    if (path.startsWith('/picks/') && req.method === 'DELETE') {
      const pickIndex = picks.findIndex(candidate => candidate.id === path.split('/')[2]);
      if (pickIndex < 0) return res.status(404).json({ message: 'Pick not found.' });
      if (picks[pickIndex].isLocked) return res.status(409).json({ message: 'This pick is locked.' });
      picks.splice(pickIndex, 1);
      return res.status(204).end();
    }
    if (path === '/groups' && req.method === 'POST') {
      const name = String(req.body?.name || '').trim();
      if (!name) return res.status(400).json({ message: 'Group name is required.' });
      const group = buildFixtureGroup(name, req.body?.description, Boolean(req.body?.isPrivate));
      fixtureGroups.push(group);
      fixtureGroupMessages[group.id] = [];
      return res.status(201).json(group);
    }
    const groupJoinMatch = path.match(/^\/groups\/([^/]+)\/join$/);
    if (groupJoinMatch && req.method === 'POST') {
      const group = fixtureGroups.find(candidate => candidate.id === groupJoinMatch[1]);
      if (!group) return res.status(404).json({ message: 'Group not found.' });
      return res.json({ joined: true, groupId: group.id });
    }
    const groupChatMatch = path.match(/^\/groups\/([^/]+)\/chat$/);
    if (groupChatMatch && req.method === 'POST') {
      const content = String(req.body?.content || '').trim();
      if (!content) return res.status(400).json({ message: 'Message is required.' });
      const message = { id: `audit-group-message-${Date.now()}`, groupId: groupChatMatch[1], userId: fixtureUser.id, username: fixtureUser.username, content, createdAt: new Date().toISOString() };
      (fixtureGroupMessages[groupChatMatch[1]] ||= []).push(message);
      return res.status(201).json(message);
    }
    if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).json({ error: 'UI audit fixtures are read-only except for in-memory chat.' });
    if (path === '/me') return res.json(fixtureUser);
    if (path === '/me/dashboard') return res.json({
      upcomingEvent: { id: event.id, name: event.name, date: event.date, status: event.status, picksMade: picks.filter(pick => pick.confidenceFlag !== 'red').length, picksRequired: fights.length, totalFights: fights.length },
      leaderboardContext: { rank: 3, netUnits: 7.8, eventId: event.id, eventName: event.name },
      raffleStatus: { eligible: true, message: 'You are entered!' },
      bettingStats: null,
      intelligence: news.slice(0, 3),
      recentActivity: { eventName: 'GRIT Fight Night 01', netUnits: 4.2, picks: 8, correctPicks: 6, totalFights: 8, finalRank: 3 },
      progression: { starLevel: 4, badge: 'master', keys: 3 },
      currentStreak: fixtureUser.currentStreak,
      tier: fixtureUser.tier,
      lastUpdated: new Date().toISOString(),
    });
    if (path === '/me/stats') return res.json({ totalPicks: picks.length, wins: 3, losses: 0, pending: Math.max(0, picks.length - 3), accuracy: 100, totalUnits: picks.length, totalProfit: 4.2, roi: 46.7, currentStreak: fixtureUser.currentStreak, bestStreak: 7, picks, perEventStats: [] });
    if (path === '/me/settings') return res.json({
      enableSounds: true,
      enableCelebrations: true,
      showStreaks: true,
      showBadges: true,
      enablePushNotifications: false,
      enableEventReminders: true,
      enableResultAlerts: true,
      enableLeaderboardUpdates: false,
      showBettingTracker: false,
      unitSize: 0,
    });
    if (path === '/events') return res.json(upcomingEvents);
    if (path === '/events/completed') return res.json([completedEvent]);
    if (path.startsWith('/events/')) {
      const requestedEvent = upcomingEvents.find(candidate => candidate.id === path.split('/')[2]);
      if (requestedEvent) return res.json(requestedEvent);
    }
    if (path === '/fighters') return res.json(fighters);
    if (/^\/fighters\/[^/]+\/tags$/.test(path)) return res.json([]);
    if (path.startsWith('/fighters/')) return res.json(fighters.find((fighter) => fighter.id === path.split('/')[2]) || fighters[0]);
    if (path === '/leaderboard') return res.json({ leaderboard, maxPoints: leaderboard[0].totalPoints });
    if (path.startsWith('/leaderboard/latest/')) return res.json({ rankings: leaderboard.map((entry) => ({ rank: entry.rank, userId: entry.id, username: entry.username, netUnits: entry.totalPoints / 100, currentStreak: entry.rank % 4 })) });
    if (path === '/news') return res.json(news);
    if (path.startsWith('/news/fighter/')) return res.json([]);
    if (path.startsWith('/news/')) return res.json(news.find((article) => article.id === path.split('/')[2]) || news[0]);
    if (path === '/fights/results') return res.json(completedResults);
    if (path === '/picks') return res.json([...picks, ...completedPicks]);
    if (path.startsWith('/picks/event/')) {
      const requestedEventId = path.split('/')[3];
      return res.json(requestedEventId === completedEvent.id ? completedPicks : picks);
    }
    if (path.startsWith('/picks/distribution/')) {
      const fightId = path.split('/')[3];
      const fight = fights.find(candidate => candidate.id === fightId);
      if (!fight) return res.status(404).json({ message: 'Fight not found.' });
      return res.json({ totalPicks: 25, distribution: [
        { fighterId: fight.fighter1Id, fighterName: fighters.find(candidate => candidate.id === fight.fighter1Id)?.lastName, percentage: '56.0' },
        { fighterId: fight.fighter2Id, fighterName: fighters.find(candidate => candidate.id === fight.fighter2Id)?.lastName, percentage: '44.0' },
      ] });
    }
    if (path === '/groups/my') return res.json(fixtureGroups);
    if (path === '/groups/browse') return res.json(fixtureGroups.filter(group => !group.isPrivate));
    if (groupChatMatch) return res.json(fixtureGroupMessages[groupChatMatch[1]] || []);
    const groupDetailMatch = path.match(/^\/groups\/([^/]+)$/);
    if (groupDetailMatch) {
      const group = fixtureGroups.find(candidate => candidate.id === groupDetailMatch[1]);
      return group ? res.json(group) : res.status(404).json({ message: 'Group not found.' });
    }
    if (path === '/chat/config') return res.json({ isOpen: true, cooldownMinutes: 0 });
    if (path === '/chat') {
      const chatType = req.query.chat_type === 'country' ? 'country' : 'global';
      return res.json(chatMessages.filter(message => message.chatType === chatType));
    }
    if (path === '/slip-wall' || path === '/slips/mine') return res.json([]);
    next();
  });
}
