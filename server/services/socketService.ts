import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { db } from '../db';
import { users } from '../../shared/models/auth';

// Socket request with user extension
interface SocketRequest {
    user?: Express.User;
}

let io: SocketIOServer | null = null;

type SocketUserResolver = (socket: Socket) => Promise<Express.User | null>;

interface SocketInitOptions {
    resolveUser?: SocketUserResolver;
    logLifecycle?: boolean;
}

async function resolveClerkSocketUser(socket: Socket): Promise<Express.User | null> {
    const token = typeof socket.handshake.auth?.token === 'string'
        ? socket.handshake.auth.token
        : null;

    if (!token || !env.CLERK_SECRET_KEY) return null;

    const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
    if (!payload.sub) return null;

    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user) return null;

    return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role ?? 'user',
        tier: (user.tier ?? 'free') as Express.User['tier'],
        country: user.country,
        isAiChatBlocked: user.isAiChatBlocked ?? false,
        language: user.language ?? 'en',
    };
}

// Production CORS validation
function getAllowedOrigins(): string[] | boolean {
    if (env.NODE_ENV !== 'production') {
        return ['*'];
    }

    const domains = [
        env.CUSTOM_DOMAIN,
        env.RAILWAY_PUBLIC_DOMAIN,
        env.REPLIT_DEV_DOMAIN,
        ...(env.REPLIT_DOMAINS?.split(',') ?? []),
    ]
        .map(domain => domain?.trim())
        .filter((domain): domain is string => Boolean(domain));

    if (domains.length === 0) {
        logger.warn('[socket] No production domain configured. Allowing Socket.IO origins until CUSTOM_DOMAIN or RAILWAY_PUBLIC_DOMAIN is set.');
        return true;
    }

    return domains.map(domain => (domain.startsWith('http') ? domain : `https://${domain}`));
}

export const socketService = {
    /**
     * Initializes the Socket.IO server.
     * @param httpServer The HTTP server to attach to.
     */
    init(httpServer: HTTPServer, options: SocketInitOptions = {}) {
        if (io) return io;

        const allowedOrigins = getAllowedOrigins();
        const resolveUser = options.resolveUser ?? resolveClerkSocketUser;
        const logLifecycle = options.logLifecycle ?? true;

        io = new SocketIOServer(httpServer, {
            cors: {
                origin: allowedOrigins,
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        io.use(async (socket, next) => {
            try {
                const user = await resolveUser(socket);
                if (!user) return next(new Error('Unauthorized'));
                (socket.request as SocketRequest).user = user;
                next();
            } catch (error) {
                logger.warn('Socket authentication failed', {
                    socketId: socket.id,
                    error: error instanceof Error ? error.message : String(error),
                });
                next(new Error('Unauthorized'));
            }
        });

        io.on('connection', (socket) => {
            const user = (socket.request as SocketRequest).user;

            if (!user) {
                logger.warn(`Unauthenticated socket connection attempt: ${socket.id}`, { transport: socket.conn.transport.name });
                logger.metric('socket_auth_fail', 1, { socketId: socket.id });
                socket.disconnect(true);
                return;
            }

            if (logLifecycle) logger.info(`Authenticated client connected: ${user.username || user.id} (${socket.id})`);
            if (logLifecycle) logger.metric('socket_connect', 1, { userId: user.id });
            socket.join('global');

            socket.on('join_event_chat', (eventId: string) => {
                if (!eventId || typeof eventId !== 'string') return;
                // Validate eventId format (UUID)
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(eventId)) {
                    logger.warn(`Invalid eventId format: ${eventId}`);
                    return;
                }
                socket.join(`event_${eventId}`);
                if (logLifecycle) logger.info(`User ${user.username || user.id} joined event chat: ${eventId}`);
            });

            socket.on('join_country_chat', (countryCode: string) => {
                if (!countryCode || typeof countryCode !== 'string') return;
                // Normalize and validate country code
                const normalizedCode = countryCode.toUpperCase().slice(0, 2);
                if (!/^[A-Z]{2}$/.test(normalizedCode)) {
                    logger.warn(`Invalid country code: ${countryCode}`);
                    return;
                }
                // Security: Only allow users to join their own country's chat
                if (user.country !== normalizedCode && user.role !== 'admin') {
                    logger.warn(`User ${user.username || user.id} attempted to join unauthorized country chat: ${normalizedCode}`);
                    return;
                }
                socket.join(`country_${normalizedCode}`);
                if (logLifecycle) logger.info(`User ${user.username || user.id} joined country chat: ${normalizedCode}`);
            });

            socket.on('leave_room', (roomName: string) => {
                if (!roomName || typeof roomName !== 'string') return;
                socket.leave(roomName);
                if (logLifecycle) logger.info(`User ${user.username || user.id} left room: ${roomName}`);
            });

            socket.on('typing', (data: { room: string }) => {
                if (!data?.room || typeof data.room !== 'string') return;
                socket.to(data.room).emit('user_typing', {
                    username: user.username,
                    room: data.room
                });
            });

            socket.on('stop_typing', (data: { room: string }) => {
                if (!data?.room || typeof data.room !== 'string') return;
                socket.to(data.room).emit('user_stop_typing', {
                    username: user.username,
                    room: data.room
                });
            });

            socket.on('disconnect', (reason) => {
                if (logLifecycle) logger.info(`Client disconnected: ${socket.id} (${reason})`, { userId: user.id });
                if (logLifecycle) logger.metric('socket_disconnect', 1, { userId: user.id, reason });
            });

            socket.on('error', (err) => {
                logger.error(`Socket error for user ${user.id}`, err);
                logger.metric('socket_error', 1, { userId: user.id });
            });
        });

        logger.info('Socket.IO initialized with authentication');
        return io;
    },

    /**
     * Emits an event to all connected clients or a specific room.
     * @param event The event name.
     * @param data The data to send.
     * @param room Optional room ID to target.
     */
    emit(event: string, data: unknown, room?: string) {
        if (!io) {
            logger.warn('Socket.IO not initialized. Event not emitted.');
            return;
        }

        if (room) {
            io.to(room).emit(event, data);
        } else {
            io.emit(event, data);
        }
    },

    /**
     * Gets the Socket.IO server instance.
     */
    getIO() {
        return io;
    },

    async close() {
        if (!io) return;
        await new Promise<void>((resolve) => io!.close(() => resolve()));
        io = null;
    },
};

export default socketService;
