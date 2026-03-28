import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import passport from 'passport';
import { sessionMiddleware } from '../replit_integrations/auth/replitAuth';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// Socket request with user extension
interface SocketRequest {
    user?: Express.User;
}

let io: SocketIOServer | null = null;

// Production CORS validation
function getAllowedOrigins(): string[] {
    if (env.NODE_ENV !== 'production') {
        return ['*'];
    }
    if (!env.REPLIT_DEV_DOMAIN) {
        throw new Error('REPLIT_DEV_DOMAIN must be set in production');
    }
    return [`https://${env.REPLIT_DEV_DOMAIN}`];
}

export const socketService = {
    /**
     * Initializes the Socket.IO server.
     * @param httpServer The HTTP server to attach to.
     */
    init(httpServer: HTTPServer) {
        if (io) return io;

        const allowedOrigins = getAllowedOrigins();

        io = new SocketIOServer(httpServer, {
            cors: {
                origin: allowedOrigins,
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        // Use the same session middleware as Express
        io.use((socket, next) => {
            sessionMiddleware(socket.request as never, {} as never, next as never);
        });

        // Use passport to populate socket.request.user
        io.use((socket, next) => {
            passport.initialize()(socket.request as never, {} as never, () => {
                passport.session()(socket.request as never, {} as never, next as never);
            });
        });

        io.on('connection', (socket) => {
            const user = (socket.request as SocketRequest).user;

            if (!user) {
                logger.warn(`Unauthenticated socket connection attempt: ${socket.id}`, { transport: socket.conn.transport.name });
                logger.metric('socket_auth_fail', 1, { socketId: socket.id });
                socket.disconnect(true);
                return;
            }

            logger.info(`Authenticated client connected: ${user.username || user.id} (${socket.id})`);
            logger.metric('socket_connect', 1, { userId: user.id });

            socket.on('join_event_chat', (eventId: string) => {
                if (!eventId || typeof eventId !== 'string') return;
                // Validate eventId format (UUID)
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(eventId)) {
                    logger.warn(`Invalid eventId format: ${eventId}`);
                    return;
                }
                socket.join(`event_${eventId}`);
                logger.info(`User ${user.username || user.id} joined event chat: ${eventId}`);
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
                logger.info(`User ${user.username || user.id} joined country chat: ${normalizedCode}`);
            });

            socket.on('leave_room', (roomName: string) => {
                if (!roomName || typeof roomName !== 'string') return;
                socket.leave(roomName);
                logger.info(`User ${user.username || user.id} left room: ${roomName}`);
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
                logger.info(`Client disconnected: ${socket.id} (${reason})`, { userId: user.id });
                logger.metric('socket_disconnect', 1, { userId: user.id, reason });
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
};

export default socketService;
