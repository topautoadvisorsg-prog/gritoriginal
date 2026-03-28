import type { Express, Request } from "express";

import { isAuthenticated } from '../../auth/guards';
import { db } from "../../db";
import { users, userPicks, events, eventFights, newsArticles, userKeys, userSettings, rafflePool } from "../../../shared/schema";
import { leaderboardSnapshots, type User } from "../../../shared/models/auth";
import { eq, desc, sql, and, gte, lte, inArray, ne } from "drizzle-orm";
import { config } from '../../config/env';
import { calculateProfit } from "../../roiCalculator";
import { logger } from '../../utils/logger';

export function registerDashboardRoutes(app: Express): void {
    app.get("/api/me/dashboard", isAuthenticated, async (req, res) => {
        try {
            const user = req.user as User;
            const userId = user.id;

            // 1. Core User Data & Settings
            const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
            const [keysResult] = await db.select({ count: sql<number>`count(*)` }).from(userKeys).where(eq(userKeys.userId, userId));
            const keysCount = Number(keysResult?.count || 0);

            // 2. Upcoming Event & Participation
            const [nextEvent] = await db.select().from(events)
                .where(and(ne(events.status, 'ARCHIVED'), ne(events.status, 'CLOSED')))
                .orderBy(events.date).limit(1);

            let upcomingEvent = null;
            if (nextEvent) {
                const fightsInEvent = await db.select().from(eventFights).where(eq(eventFights.eventId, nextEvent.id));
                const userPicksInEvent = await db.select().from(userPicks).where(and(eq(userPicks.userId, userId), inArray(userPicks.fightId, fightsInEvent.map(f => f.id))));
                
                const requiredPicks = config.getRequiredPicks(fightsInEvent.length);
                const picksMade = userPicksInEvent.filter(p => p.confidenceFlag !== 'red').length;

                upcomingEvent = {
                    id: nextEvent.id,
                    name: nextEvent.name,
                    date: nextEvent.date,
                    status: nextEvent.status,
                    picksMade,
                    picksRequired: requiredPicks,
                    totalFights: fightsInEvent.length,
                };
            }

            // 3. Leaderboard Context (Recent Active Event)
            let leaderboardContext = null;
            const [lastEventSnapshot] = await db.select().from(leaderboardSnapshots).orderBy(desc(leaderboardSnapshots.createdAt)).limit(1);
            if (lastEventSnapshot) {
                const rankings = lastEventSnapshot.rankings || [];
                const userRankIdx = rankings.findIndex(r => r.userId === userId);
                if (userRankIdx !== -1) {
                    const userRank = rankings[userRankIdx];
                    leaderboardContext = {
                        rank: userRank.rank,
                        netUnits: (userRank as any).netUnits || 0,
                        above: rankings[userRankIdx - 1] || null,
                        below: rankings[userRankIdx + 1] || null,
                    };
                }
            }

            // 4. Raffle Eligibility
            let raffleStatus = { eligible: false, message: 'You qualify starting next month.' };
            if (user.subscriptionStartDate) {
                const startDate = new Date(user.subscriptionStartDate);
                const now = new Date();
                const monthsActive = (now.getUTCFullYear() - startDate.getUTCFullYear()) * 12 + (now.getUTCMonth() - startDate.getUTCMonth());
                if (monthsActive >= 1) {
                    raffleStatus = { eligible: true, message: 'You are entered!' };
                }
            }

            // 5. Betting Tracker (Calculated if enabled)
            let bettingStats = null;
            if (settings?.showBettingTracker && (settings.unitSize ?? 0) > 0) {
                const unitSize = settings.unitSize ?? 0;
                const activePicks = await db.select().from(userPicks).where(and(eq(userPicks.userId, userId), eq(userPicks.status, 'active')));
                let wagered = 0;
                let profit = 0;
                for (const p of activePicks) {
                    wagered += (p.units || 1) * unitSize;
                    if (p.pointsAwarded > 0 && p.lockedOdds) {
                        profit += calculateProfit(p.lockedOdds, p.units || 1) * unitSize;
                    } else if (p.pointsAwarded < 0) {
                        profit -= (p.units || 1) * unitSize;
                    }
                }
                bettingStats = {
                    unitSize: unitSize,
                    totalWagered: wagered,
                    totalProfitLoss: profit,
                    roi: wagered > 0 ? (profit / wagered) * 100 : 0
                };
            }

            // 6. Intelligence Feed Teaser
            const recentIntelligence = await db.select().from(newsArticles)
                .where(and(eq(newsArticles.layer, 'intelligence'), eq(newsArticles.isPublished, true)))
                .orderBy(desc(newsArticles.publishedAt)).limit(3);

            // 7. Recent Activity (Last Closed Event)
            const [lastClosedEvent] = await db.select().from(events)
                .where(inArray(events.status, ['Closed', 'Completed', 'ARCHIVED']))
                .orderBy(desc(events.date))
                .limit(1);

            let recentActivity = null;
            if (lastClosedEvent) {
                const fights = await db.select().from(eventFights).where(eq(eventFights.eventId, lastClosedEvent.id));
                const picks = await db.select().from(userPicks).where(and(eq(userPicks.userId, userId), inArray(userPicks.fightId, fights.map(f => f.id))));
                
                let eventProfit = 0;
                let correctPicks = 0;
                const totalFights = fights.length;

                for (const p of picks) {
                    if (p.pointsAwarded > 0) correctPicks++;
                    if (p.pointsAwarded > 0 && p.lockedOdds) eventProfit += calculateProfit(p.lockedOdds, p.units || 1);
                    else if (p.pointsAwarded < 0) eventProfit -= (p.units || 1);
                }
                
                let isNearPerfect = false;
                if (totalFights >= 2) {
                    isNearPerfect = correctPicks >= (totalFights - 1) && correctPicks < totalFights;
                }

                let isNearTop = false;
                let finalRank = leaderboardContext?.rank || 0;
                let top10pct = 0;
                
                if (lastEventSnapshot && lastEventSnapshot.rankings) {
                    const totalPlayers = lastEventSnapshot.rankings.length;
                    top10pct = Math.max(1, Math.floor(totalPlayers * 0.10));
                    const threshold = 3;
                    const buffer = 5;

                    if ((finalRank <= threshold + buffer && finalRank > threshold) || 
                        (finalRank <= top10pct + buffer && finalRank > top10pct)) {
                        isNearTop = true;
                    }
                }
                
                recentActivity = {
                    eventName: lastClosedEvent.name,
                    netUnits: eventProfit,
                    picks: picks.length,
                    correctPicks,
                    totalFights,
                    isNearPerfect,
                    isNearTop,
                    finalRank,
                    top10pct
                };
            }

            res.json({
                upcomingEvent,
                leaderboardContext,
                raffleStatus,
                bettingStats,
                intelligence: recentIntelligence,
                recentActivity,
                progression: {
                    starLevel: user.starLevel,
                    badge: user.progressBadge,
                    keys: keysCount
                },
                currentStreak: user.currentStreak || 0,
                tier: user.tier,
                lastUpdated: user.lastProgressionCalc
            });
        } catch (error) {
            logger.error("Error fetching dashboard:", error);
            res.status(500).json({ message: "Failed to fetch dashboard data" });
        }
    });
}
