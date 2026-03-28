import { db } from "../db";
import { chatMessages, chatConfig, chatBans, chatMutes, slips } from "../../shared/schema";
import { users } from "../../shared/models/auth";
import { eq, desc, and, gt, or, isNull, isNotNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../utils/logger';
import { socketService } from "./socketService";

// ──────────────────────────────────────
// Chat Config
// ──────────────────────────────────────

export async function getChatConfig() {
    const [config] = await db.select().from(chatConfig).where(eq(chatConfig.id, 1));
    if (!config) {
        // Return safe defaults if not yet seeded
        return { id: 1, isOpen: true, cooldownMinutes: 30, updatedAt: new Date(), updatedBy: null };
    }
    return config;
}

// ──────────────────────────────────────
// Chat Message Operations
// ──────────────────────────────────────

export async function getMessages(options: {
    chatType?: string;
    eventId?: string;
    countryCode?: string;
    limit?: number;
}) {
    const { chatType = 'global', eventId, countryCode, limit = 50 } = options;

    let rows;
    if (chatType === 'event' && eventId) {
        rows = await db.select()
            .from(chatMessages)
            .where(and(
                eq(chatMessages.chatType, 'event'),
                eq(chatMessages.eventId, eventId)
            ))
            .orderBy(desc(chatMessages.createdAt))
            .limit(Number(limit));
    } else if (chatType === 'country' && countryCode) {
        rows = await db.select()
            .from(chatMessages)
            .where(and(
                eq(chatMessages.chatType, 'country'),
                eq(chatMessages.countryCode, countryCode)
            ))
            .orderBy(desc(chatMessages.createdAt))
            .limit(Number(limit));
    } else {
        rows = await db.select()
            .from(chatMessages)
            .where(eq(chatMessages.chatType, 'global'))
            .orderBy(desc(chatMessages.createdAt))
            .limit(Number(limit));
    }

    // Enrich slip messages with imageUrl
    const slipIds = [...new Set(rows.filter(r => r.slipId).map(r => r.slipId as string))];
    const slipMap: Record<string, string> = {};
    if (slipIds.length > 0) {
        const allSlipRows = await Promise.all(
            slipIds.map(id => db.select({ id: slips.id, imageUrl: slips.imageUrl }).from(slips).where(eq(slips.id, id)).limit(1))
        );
        for (const batch of allSlipRows) {
            if (batch[0]) slipMap[batch[0].id] = batch[0].imageUrl;
        }
    }

    return rows.map(r => ({
        ...r,
        slipImageUrl: r.slipId ? (slipMap[r.slipId] ?? null) : null,
    }));
}

export async function postMessage(userId: string, message: string, options: {
    chatType?: string;
    eventId?: string;
    countryCode?: string;
    messageType?: string;
    slipId?: string;
}) {
    const { chatType = 'global', eventId, countryCode, messageType = 'text', slipId } = options;

    // ── 1. Check chat open/closed ───────────────────────────────────────────
    const config = await getChatConfig();
    if (!config.isOpen) {
        throw new Error('CHAT_CLOSED');
    }

    // ── 2. Check ban ────────────────────────────────────────────────────────
    const now = new Date();
    const [activeBan] = await db.select()
        .from(chatBans)
        .where(and(
            eq(chatBans.userId, userId),
            or(isNull(chatBans.expiresAt), gt(chatBans.expiresAt, now))
        ))
        .limit(1);

    if (activeBan) {
        throw new Error('USER_BANNED');
    }

    // ── 3. Check mute ───────────────────────────────────────────────────────
    const [activeMute] = await db.select()
        .from(chatMutes)
        .where(and(
            eq(chatMutes.userId, userId),
            or(isNull(chatMutes.expiresAt), gt(chatMutes.expiresAt, now))
        ))
        .limit(1);

    if (activeMute) {
        throw new Error('USER_MUTED');
    }

    // ── 4. Validate message ─────────────────────────────────────────────────
    if (messageType !== 'slip') {
        if (!message || message.trim().length === 0) {
            throw new Error('MESSAGE_EMPTY');
        }
        if (message.length > 500) {
            throw new Error('MESSAGE_TOO_LONG');
        }
    }

    // ── 5. Slip-specific checks ─────────────────────────────────────────────
    if (messageType === 'slip') {
        if (!slipId) {
            throw new Error('SLIP_ID_REQUIRED');
        }

        // Verify slip is approved and belongs to user
        const [slip] = await db.select()
            .from(slips)
            .where(and(eq(slips.id, slipId), eq(slips.userId, userId), eq(slips.status, 'approved')))
            .limit(1);

        if (!slip) {
            throw new Error('SLIP_NOT_FOUND');
        }

        // Cooldown: find user's most recent slip posted to chat (postedAt set, nulls excluded)
        const [lastPostedSlip] = await db.select()
            .from(slips)
            .where(and(eq(slips.userId, userId), isNotNull(slips.postedAt)))
            .orderBy(desc(slips.postedAt))
            .limit(1);

        // Check cooldown based on last posted slip's postedAt timestamp
        if (lastPostedSlip?.postedAt) {
            const cooldownMs = (config.cooldownMinutes ?? 30) * 60 * 1000;
            const elapsed = now.getTime() - new Date(lastPostedSlip.postedAt).getTime();
            if (elapsed < cooldownMs) {
                const remainingMinutes = Math.ceil((cooldownMs - elapsed) / 60000);
                throw Object.assign(new Error('SLIP_COOLDOWN'), { remainingMinutes });
            }
        }
    }

    // ── 6. Resolve country code ─────────────────────────────────────────────
    let resolvedCountryCode: string | null = null;

    if (chatType === 'country') {
        if (countryCode) {
            resolvedCountryCode = countryCode;
        } else {
            const [user] = await db.select().from(users).where(eq(users.id, userId));
            resolvedCountryCode = user?.country || null;

            if (!resolvedCountryCode) {
                throw new Error('NO_COUNTRY_SET');
            }
        }
    }

    // ── 7. Insert message ───────────────────────────────────────────────────
    const [newMessage] = await db.insert(chatMessages)
        .values({
            id: uuidv4(),
            userId,
            eventId: chatType === 'event' ? eventId : null,
            chatType,
            countryCode: resolvedCountryCode,
            message: messageType === 'slip' ? (message?.trim() || '') : message.trim(),
            messageType,
            slipId: messageType === 'slip' ? slipId : null,
            createdAt: new Date()
        })
        .returning();

    // ── 7b. Mark slip as posted (set postedAt for cooldown tracking) ─────────
    if (messageType === 'slip' && slipId) {
        await db.update(slips)
            .set({ postedAt: new Date() })
            .where(eq(slips.id, slipId));
    }

    // ── 8. Broadcast via Socket.IO ──────────────────────────────────────────
    const scrubbedMessage = {
        id: newMessage.id,
        message: newMessage.message,
        messageType: newMessage.messageType,
        slipId: newMessage.slipId,
        chatType: newMessage.chatType,
        eventId: newMessage.eventId,
        countryCode: newMessage.countryCode,
        createdAt: newMessage.createdAt,
    };

    let room: string | undefined;
    if (chatType === 'event') {
        room = `event_${eventId}`;
    } else if (chatType === 'country') {
        room = `country_${resolvedCountryCode}`;
    }

    socketService.emit('new_message', scrubbedMessage, room);

    return newMessage;
}
