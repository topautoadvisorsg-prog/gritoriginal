import type { Express, Request, Response } from "express";

import { isAuthenticated } from '../../auth/guards';
import * as chatService from '../../services/chatService';
import { logger } from '../../utils/logger';

interface ChatRouteError extends Error {
    remainingMinutes?: number;
}

function asChatRouteError(error: unknown): ChatRouteError {
    return error instanceof Error ? error : new Error(String(error));
}

/**
 * Chat routes — all business logic delegated to chatService.
 */
export function registerChatRoutes(app: Express) {

    // Get chat config (public — used by frontend to show closed state)
    app.get("/api/chat/config", async (_req: Request, res: Response) => {
        try {
            const config = await chatService.getChatConfig();
            res.json({ isOpen: config.isOpen, cooldownMinutes: config.cooldownMinutes });
        } catch (error) {
            logger.error("Error fetching chat config:", error);
            res.status(500).json({ error: "Failed to fetch chat config" });
        }
    });

    // Get chat messages with type filtering
    app.get("/api/chat", async (req: Request, res: Response) => {
        try {
            const { event_id, chat_type, country_code, limit } = req.query;

            const messages = await chatService.getMessages({
                chatType: chat_type as string,
                eventId: event_id as string,
                countryCode: country_code as string,
                limit: limit ? Number(limit) : undefined,
            });

            res.json(messages);
        } catch (error) {
            logger.error("Error fetching chat messages:", error);
            res.status(500).json({ error: "Failed to fetch messages" });
        }
    });

    // Post a new chat message
    app.post("/api/chat", isAuthenticated, async (req: Request, res: Response) => {
        try {
            const { message, eventId, chatType, countryCode, messageType, slipId } = req.body;
            const userId = req.user.id;

            if (messageType !== 'slip') {
                if (!message || message.trim().length === 0) {
                    return res.status(400).json({ error: "Message cannot be empty" });
                }

                if (message.length > 1000) {
                    return res.status(400).json({ error: "Message too long (max 1000 characters)" });
                }
            }

            if (chatType === 'event' && !eventId) {
                return res.status(400).json({ error: "eventId required for event chat" });
            }

            const newMessage = await chatService.postMessage(userId, message, {
                chatType,
                eventId,
                countryCode,
                messageType,
                slipId,
            });

            res.status(201).json(newMessage);
        } catch (error: unknown) {
            const chatError = asChatRouteError(error);
            if (chatError.message === 'CHAT_CLOSED') {
                return res.status(403).json({ error: "Chat opens during live events" });
            }
            if (chatError.message === 'USER_BANNED') {
                return res.status(403).json({ error: "You are banned from chat" });
            }
            if (chatError.message === 'USER_MUTED') {
                return res.status(403).json({ error: "You are muted in chat" });
            }
            if (chatError.message === 'NO_COUNTRY_SET') {
                return res.status(400).json({ error: "Set your country in profile settings to use country chat" });
            }
            if (chatError.message === 'SLIP_COOLDOWN') {
                return res.status(429).json({
                    error: "Slip cooldown active",
                    remainingMinutes: chatError.remainingMinutes,
                });
            }
            if (chatError.message === 'SLIP_NOT_FOUND') {
                return res.status(404).json({ error: "Slip not found or not approved" });
            }
            if (chatError.message === 'SLIP_ID_REQUIRED') {
                return res.status(400).json({ error: "slipId is required for slip messages" });
            }
            logger.error("Error posting chat message:", error);
            res.status(500).json({ error: "Failed to post message" });
        }
    });
}
