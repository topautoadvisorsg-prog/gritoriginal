import { useEffect, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
    const { getToken, isSignedIn } = useClerkAuth();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!isSignedIn) {
            setSocket(null);
            return;
        }

        const connection = io({
            path: '/socket.io',
            auth: async (callback) => {
                try {
                    callback({ token: await getToken() });
                } catch {
                    callback({ token: null });
                }
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            withCredentials: true,
        });

        setSocket(connection);

        connection.on('connect', () => {
            if (import.meta.env.DEV) console.log('Socket.IO connected:', connection.id);
        });

        connection.on('disconnect', (reason) => {
            if (import.meta.env.DEV) console.log('Socket.IO disconnected:', reason);
        });

        connection.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
        });

        return () => {
            connection.disconnect();
            setSocket(null);
        };
    }, [getToken, isSignedIn]);

    return socket;
}

export default useSocket;
