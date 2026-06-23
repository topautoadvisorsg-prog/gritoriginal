import type { Express, Request, Response } from "express";

import { isAuthenticated, requireTier } from '../../auth/guards';
import { db } from "../../db";
import {
    aiChatMessages, fighters, newsArticles, fighterTags, fighterTagDefinitions,
    events, eventFights, aiChatConfig, aiChatLogs, users
} from "../../../shared/schema";
import { userPicks } from "../../../shared/models/auth";
import { eq, desc, and, asc, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../../utils/logger';
import { openmeterService } from "../../services/openmeterService";
import {
    getActiveSuggestedQuestions,
    isQuestionSuggested,
    normalizeQuestionKey,
    checkQaCache,
    storeQaCache,
    trackFightChatOpen,
} from '../../ai/fightQaCache';

// Context Caching for Scaling
interface CachedFight {
    f1?: typeof fighters.$inferSelect;
    f2?: typeof fighters.$inferSelect;
    weightClass: string;
}
interface CachedEvent {
    event: typeof events.$inferSelect;
    fights: CachedFight[];
}
let cachedNextEvent: CachedEvent | null = null;
let lastEventFetch = 0;
const EVENT_CACHE_TTL = 60000; // 1 minute

let configCache: { [key: string]: string } | null = null;
let lastConfigFetch = 0;

async function getAiConfig() {
    const now = Date.now();
    if (configCache && (now - lastConfigFetch < 60000)) {
        return configCache;
    }

    const configs = await db.select().from(aiChatConfig);
    const cache: { [key: string]: string } = {};
    configs.forEach(c => cache[c.section] = c.content);

    configCache = cache;
    lastConfigFetch = now;
    return cache;
}

export function registerAIChatRoutes(app: Express) {

    // --- User Chat Routes ---

    app.get("/api/ai/chat/history", isAuthenticated, requireTier('premium'), async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });
            const { limit = 50 } = req.query;

            const messages = await db.select()
                .from(aiChatMessages)
                .where(eq(aiChatMessages.userId, userId))
                .orderBy(asc(aiChatMessages.createdAt))
                .limit(Number(limit));

            res.json(messages);
        } catch (error) {
            logger.error("Error fetching AI chat history:", error);
            res.status(500).json({ error: "Failed to fetch chat history" });
        }
    });

    // Suggested questions for fight-context mode (same list for every fight)
    app.get("/api/ai/fight/:fightId/suggested-questions", isAuthenticated, requireTier('premium'), async (req, res) => {
        try {
            const questions = await getActiveSuggestedQuestions();
            res.json({ questions });
        } catch (error) {
            logger.error('[Suggested Questions] Failed to fetch:', error);
            res.json({ questions: [] });
        }
    });

    // Track fight analyst chat open (engagement analytics)
    app.post("/api/ai/fight/:fightId/open", isAuthenticated, async (req, res) => {
        const { fightId } = req.params;
        trackFightChatOpen(fightId); // fire-and-forget
        res.json({ ok: true });
    });

    app.post("/api/ai/chat", isAuthenticated, requireTier('premium'), async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });
            const { message, context } = req.body;

            // OPTIMIZATION: Fetch user, config, and next event in parallel
            const [userResult, config, eventResult] = await Promise.all([
                db.select().from(users).where(eq(users.id, userId)).then(r => r[0]),
                getAiConfig(),
                (async () => {
                    const now = Date.now();
                    if (cachedNextEvent && (now - lastEventFetch < EVENT_CACHE_TTL)) {
                        return cachedNextEvent;
                    }
                    const [event] = await db.select().from(events)
                        .where(inArray(events.status, ['Upcoming', 'Live']))
                        .orderBy(events.date)
                        .limit(1);

                    if (event) {
                        const fights = await db.select().from(eventFights).where(eq(eventFights.eventId, event.id));
                        // Batch fetch fighters for these fights
                        const fighterIds = fights.flatMap(f => [f.fighter1Id, f.fighter2Id]);
                        const allFighters = await db.select().from(fighters).where(inArray(fighters.id, fighterIds));
                        const fighterMap = new Map(allFighters.map(f => [f.id, f]));

                        const context = {
                            event,
                            fights: fights.slice(0, 5).map(f => ({
                                ...f,
                                f1: fighterMap.get(f.fighter1Id),
                                f2: fighterMap.get(f.fighter2Id)
                            }))
                        };
                        cachedNextEvent = context;
                        lastEventFetch = now;
                        return context;
                    }
                    return null;
                })()
            ]);

            if (userResult?.isAiChatBlocked) {
                return res.status(403).json({ error: "Access to AI Chat is blocked due to policy violations." });
            }

            if (!message || message.trim().length === 0) {
                return res.status(400).json({ error: "Message cannot be empty" });
            }

            // --- QA Cache check (fight-context mode only, before any AI calls) ---
            if (context?.isFightContext && context?.fightId) {
                const qKey = normalizeQuestionKey(message.trim());
                const cachedAnswer = await checkQaCache(context.fightId, qKey);

                if (cachedAnswer) {
                    logger.info(`[QA Cache] Hit for fight ${context.fightId}, key: "${qKey}"`);

                    res.setHeader('Content-Type', 'text/event-stream');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.setHeader('Connection', 'keep-alive');

                    // Stream cached answer in one chunk — near-instant response
                    res.write(`data: ${JSON.stringify({ content: cachedAnswer })}\n\n`);
                    res.write(`data: [DONE]\n\n`);

                    // Still persist to message history (audit trail)
                    const msgId = uuidv4();
                    await db.insert(aiChatMessages).values({
                        id: uuidv4(),
                        userId,
                        role: 'user',
                        message: message.trim(),
                        context: context || null,
                        createdAt: new Date(),
                    });
                    await db.insert(aiChatMessages).values({
                        id: msgId,
                        userId,
                        role: 'assistant',
                        message: cachedAnswer,
                        context: null,
                        createdAt: new Date(),
                    });

                    res.end();
                    return;
                }
            }
            // --- End QA Cache check ---

            const { OpenAI } = await import('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const moderation = await openai.moderations.create({ input: message });
            if (moderation.results[0].flagged) {
                const flaggedCategories = Object.entries(moderation.results[0].categories)
                    .filter(([, value]) => value === true)
                    .map(([key]) => key)
                    .join(', ');
                await db.insert(aiChatLogs).values({
                    userId,
                    message: message.trim(),
                    status: 'blocked',
                    violationReason: 'OpenAI Moderation Flag: ' + flaggedCategories
                });
                return res.status(400).json({ error: "Message violates content policy (Moderation)." });
            }

            const userLang = userResult?.language || 'en';
            const userCountry = userResult?.country || 'Unknown';

            const behavior = config['behavior'] || "You are an MMA expert.";
            const functional = config['functional'] || "Discuss only MMA.";
            const policy = config['policy'] || "Block unrelated topics.";

            let systemPrompt = `${behavior}\n\n${functional}\n\n${policy}\n\nUser Context: Country: ${userCountry}, Language: ${userLang}. IMPORTANT: Reply in ${userLang}.`;

            let contextInfo = "";

            if (context?.fighterIds?.length) {
                const referencedFighters = await db.select().from(fighters).where(inArray(fighters.id, context.fighterIds));

                if (context?.isFightContext && referencedFighters.length === 2) {
                    // Fight-context mode: richer data + analyst guardrail
                    const f1 = referencedFighters[0];
                    const f2 = referencedFighters[1];

                    const formatAge = (dob: string | Date | null | undefined) => {
                        if (!dob) return 'Unknown';
                        const birth = new Date(dob);
                        const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                        return `${age}`;
                    };

                    for (const f of [f1, f2]) {
                        contextInfo += `\nFighter: ${f.firstName} ${f.lastName}`;
                        contextInfo += ` | Record: ${f.wins}-${f.losses}-${f.draws}`;
                        contextInfo += ` | Weight Class: ${f.weightClass}`;
                        if (f.weight) contextInfo += ` | Weight: ${f.weight}lbs`;
                        if (f.reach) contextInfo += ` | Reach: ${f.reach}"`;
                        if (f.stance) contextInfo += ` | Stance: ${f.stance}`;
                        if (f.dateOfBirth) contextInfo += ` | Age: ${formatAge(f.dateOfBirth)}`;
                        if (f.gym) contextInfo += ` | Gym: ${f.gym}`;
                        if (f.nationality) contextInfo += ` | Nationality: ${f.nationality}`;
                    }

                    systemPrompt += `\n\nFIGHT ANALYST MODE — MATCHUP: ${f1.firstName} ${f1.lastName} vs ${f2.firstName} ${f2.lastName}

You are acting as a dedicated fight analyst for this specific matchup. Your primary role is to deeply analyze this fight — styles, stats, recent form, keys to victory, and likely outcomes.

Guidelines:
- Lead every response with insight relevant to this matchup when possible.
- If the user asks about an unrelated fighter or topic, briefly address it then redirect: "Bringing it back to ${f1.lastName} vs ${f2.lastName}..."
- Do not fabricate fight results or stats not provided in the database context.
- Be direct, analytical, and confident — like a corner coach breaking down the fight.

Analytical framing (IMPORTANT):
- You are an analyst, NOT a prediction engine. Frame all conclusions in analytical terms.
- Use language like: "Based on the available data...", "Historically this matchup favors...", "One possible path to victory...", "The data suggests...", "Looking at the stylistic matchup..."
- Never present yourself as predicting winners with certainty. Instead, discuss advantages, tendencies, and probable scenarios.
- Avoid phrases like "I predict" or "my prediction is". Instead use "the analysis points to" or "the matchup dynamics favor".`;
                } else {
                    // General mode with fighter IDs
                    for (const f of referencedFighters) {
                        contextInfo += `\nFighter Data: ${f.firstName} ${f.lastName} | Record: ${f.wins}-${f.losses}-${f.draws} | Weight: ${f.weightClass} | Gym: ${f.gym}`;
                    }
                }
            }

            if (context?.articleIds?.length) {
                const articles = await db.select().from(newsArticles).where(inArray(newsArticles.id, context.articleIds));
                for (const a of articles) {
                    contextInfo += `\nArticle: "${a.title}" - ${a.excerpt}`;
                }
            }

            if (!context?.isFightContext && eventResult) {
                const { event, fights } = eventResult;
                contextInfo += `\n\nUpcoming Event: ${event.name} (${event.date}, ${event.venue})`;
                for (const fight of fights) {
                    contextInfo += `\nFight: ${fight.f1?.firstName} ${fight.f1?.lastName} vs ${fight.f2?.firstName} ${fight.f2?.lastName} | ${fight.weightClass}`;
                }
            }

            if (contextInfo) {
                systemPrompt += `\n\nDATABASE CONTEXT:\n${contextInfo}`;
            }

            const recentHistory = await db.select()
                .from(aiChatMessages)
                .where(eq(aiChatMessages.userId, userId))
                .orderBy(desc(aiChatMessages.createdAt))
                .limit(10);

            interface ChatMessage {
                role: 'system' | 'user' | 'assistant';
                content: string;
            }
            const messages: ChatMessage[] = [
                { role: 'system', content: systemPrompt },
                ...recentHistory.reverse().map(m => ({ role: m.role as 'user' | 'assistant', content: m.message })),
                { role: 'user', content: message.trim() }
            ];

            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            let streamAborted = false;
            req.on('close', () => {
                if (!res.writableEnded) {
                    streamAborted = true;
                    logger.warn(`[AI Stream] Aborted for user ${userId}`);
                }
            });

            logger.info(`[AI Stream] Started for user ${userId}`);

            const stream = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages,
                max_tokens: 1000,
                temperature: 0.7,
                stream: true,
            });

            let fullAiResponse = "";
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                    fullAiResponse += content;
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
            }

            // --- QA Cache store (fight-context mode only, non-blocking) ---
            if (context?.isFightContext && context?.fightId && fullAiResponse && !fullAiResponse.includes("BLOCK_USER")) {
                const qKey = normalizeQuestionKey(message.trim());
                isQuestionSuggested(message.trim()).then(suggested => {
                    storeQaCache(context.fightId, message.trim(), qKey, fullAiResponse, suggested).catch(() => {});
                }).catch(() => {
                    storeQaCache(context.fightId, message.trim(), qKey, fullAiResponse, false).catch(() => {});
                });
            }
            // --- End QA Cache store ---

            if (fullAiResponse.includes("BLOCK_USER")) {
                await db.update(users).set({ isAiChatBlocked: true }).where(eq(users.id, userId));
                await db.insert(aiChatLogs).values({
                    userId,
                    message: message.trim(),
                    status: 'blocked',
                    violationReason: 'AI Triggered Block (Jailbreak/Abuse)'
                });
                res.write(`data: ${JSON.stringify({ error: "Your access to AI chat has been suspended due to policy violations." })}\n\n`);
                res.end();
                return;
            }

            await db.insert(aiChatLogs).values({
                userId,
                message: message.trim(),
                status: 'allowed',
            });

            await db.insert(aiChatMessages).values({
                id: uuidv4(),
                userId,
                role: 'user',
                message: message.trim(),
                context: context || null,
                createdAt: new Date(),
            });

            await db.insert(aiChatMessages).values({
                id: uuidv4(),
                userId,
                role: 'assistant',
                message: fullAiResponse,
                context: null,
                createdAt: new Date(),
            });

            res.write(`data: [DONE]\n\n`);
            res.end();

            if (!streamAborted) {
                logger.info(`[AI Stream] Completed for user ${userId}`);
            }

            // Track usage asynchronously
            openmeterService.trackUsage(userId, 'ai_chat_message');

        } catch (error) {
            logger.error("AI chat error:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage.includes('API key')) return res.status(500).json({ error: "AI service not configured" });
            res.status(500).json({ error: "Failed to process AI chat message" });
        }
    });

    app.delete("/api/ai/chat/history", isAuthenticated, requireTier('premium'), async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });
            await db.delete(aiChatMessages).where(eq(aiChatMessages.userId, userId));
            res.json({ success: true });
        } catch (error) {
            logger.error("Error clearing chat history:", error);
            res.status(500).json({ error: "Failed to clear chat history" });
        }
    });
}
