import { createServer, type Server as HttpServer } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { io as createClient, type Socket } from 'socket.io-client';
import { socketService } from '../../server/services/socketService';

describe('Socket.IO authentication and fanout', () => {
  let httpServer: HttpServer | null = null;
  const clients: Socket[] = [];

  afterEach(async () => {
    for (const client of clients) client.disconnect();
    clients.length = 0;
    await socketService.close();
    if (httpServer?.listening) {
      await new Promise<void>((resolve, reject) => httpServer!.close(error => error ? reject(error) : resolve()));
    }
    httpServer = null;
  });

  it('rejects missing auth and broadcasts to authenticated global clients', async () => {
    httpServer = createServer();
    socketService.init(httpServer, {
      logLifecycle: false,
      resolveUser: async (socket) => socket.handshake.auth?.token === 'valid-test-token'
        ? {
            id: 'socket-test-user',
            email: 'socket-test@example.test',
            username: 'SocketTest',
            role: 'user',
            tier: 'free',
            country: 'MX',
            isAiChatBlocked: false,
            language: 'en',
          }
        : null,
    });

    await new Promise<void>((resolve, reject) => {
      httpServer!.once('error', reject);
      httpServer!.listen(0, '127.0.0.1', resolve);
    });

    const address = httpServer.address();
    if (!address || typeof address === 'string') throw new Error('Test server did not bind');
    const url = `http://127.0.0.1:${address.port}`;

    const authorized = createClient(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      auth: { token: 'valid-test-token' },
    });
    clients.push(authorized);
    await new Promise<void>((resolve, reject) => {
      authorized.once('connect', resolve);
      authorized.once('connect_error', reject);
    });

    const unauthorized = createClient(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
    clients.push(unauthorized);
    const authError = await new Promise<Error>(resolve => unauthorized.once('connect_error', resolve));
    expect(authError.message).toBe('Unauthorized');

    const received = new Promise<{ ok: boolean }>(resolve => authorized.once('test_broadcast', resolve));
    socketService.emit('test_broadcast', { ok: true }, 'global');
    await expect(received).resolves.toEqual({ ok: true });
  });
});
