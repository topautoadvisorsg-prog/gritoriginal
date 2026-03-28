import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Initialize socket connection
        const socket = io({
            path: '/socket.io', // Default socket.io path
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            withCredentials: true, // Required to pass session cookies
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket.IO connected:', socket.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket.IO disconnected:', reason);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    return socketRef.current;
}

export default useSocket;
