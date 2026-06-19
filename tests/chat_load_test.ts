import { createServer } from 'node:http';
import { performance } from 'node:perf_hooks';
import { io as createClient, type Socket } from 'socket.io-client';

const CLIENT_COUNT = Number(process.env.CHAT_LOAD_CLIENTS || 1000);
const BROADCAST_COUNT = Number(process.env.CHAT_LOAD_BROADCASTS || 10);
const CONNECT_BATCH_SIZE = Number(process.env.CHAT_LOAD_BATCH_SIZE || 50);
const CONNECT_BATCH_DELAY_MS = Number(process.env.CHAT_LOAD_BATCH_DELAY_MS || 50);
const CONNECT_TIMEOUT_MS = 30_000;
const FANOUT_TIMEOUT_MS = 20_000;

function percentile(values: number[], ratio: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

async function waitFor(
  predicate: () => boolean,
  timeoutMs: number,
  label: string,
): Promise<void> {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`${label} timed out after ${timeoutMs}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

async function run() {
  if (!Number.isInteger(CLIENT_COUNT) || CLIENT_COUNT < 1 || CLIENT_COUNT > 5000) {
    throw new Error('CHAT_LOAD_CLIENTS must be an integer between 1 and 5000');
  }

  const { socketService } = await import('../server/services/socketService');
  const httpServer = createServer();
  const clients: Socket[] = [];
  const latencies: number[] = [];
  let received = 0;

  socketService.init(httpServer, {
    logLifecycle: false,
    resolveUser: async (socket) => {
      const id = socket.handshake.auth?.loadTestUserId;
      if (typeof id !== 'string' || !id.startsWith('load-user-')) return null;
      return {
        id,
        email: `${id}@example.test`,
        username: id,
        role: 'user',
        tier: 'free',
        country: 'MX',
        isAiChatBlocked: false,
        language: 'en',
      };
    },
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(0, '127.0.0.1', resolve);
  });

  const address = httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind local load-test server');
  const url = `http://127.0.0.1:${address.port}`;

  try {
    const connectStarted = performance.now();
    const connectionResults: PromiseSettledResult<void>[] = [];
    for (let start = 0; start < CLIENT_COUNT; start += CONNECT_BATCH_SIZE) {
      const batchSize = Math.min(CONNECT_BATCH_SIZE, CLIENT_COUNT - start);
      const batchResults = await Promise.allSettled(
        Array.from({ length: batchSize }, (_, offset) => new Promise<void>((resolve, reject) => {
        const index = start + offset;
        const client = createClient(url, {
          transports: ['websocket'],
          forceNew: true,
          reconnection: false,
          timeout: CONNECT_TIMEOUT_MS,
          auth: { loadTestUserId: `load-user-${index + 1}` },
        });

        clients.push(client);
        client.once('connect', () => resolve());
        client.once('connect_error', reject);
        })),
      );
      connectionResults.push(...batchResults);
      if (start + batchSize < CLIENT_COUNT) {
        await new Promise(resolve => setTimeout(resolve, CONNECT_BATCH_DELAY_MS));
      }
    }

    const connectionMs = performance.now() - connectStarted;
    const connected = connectionResults.filter(result => result.status === 'fulfilled').length;
    const failed = CLIENT_COUNT - connected;

    if (failed > 0) {
      const firstFailure = connectionResults.find(result => result.status === 'rejected');
      throw new Error(`${failed} clients failed to connect: ${firstFailure?.status === 'rejected' ? firstFailure.reason : 'unknown'}`);
    }

    for (const client of clients) {
      client.on('load_test_message', (payload: { emittedAt: number }) => {
        latencies.push(Date.now() - payload.emittedAt);
        received += 1;
      });
    }

    const fanoutStarted = performance.now();
    for (let sequence = 0; sequence < BROADCAST_COUNT; sequence += 1) {
      socketService.emit('load_test_message', { sequence, emittedAt: Date.now() });
    }

    const expectedDeliveries = CLIENT_COUNT * BROADCAST_COUNT;
    await waitFor(() => received >= expectedDeliveries, FANOUT_TIMEOUT_MS, 'broadcast fanout');
    const fanoutMs = performance.now() - fanoutStarted;

    console.log('\n=== GRIT Chat Load Test ===');
    console.log(`clients: ${connected}/${CLIENT_COUNT}`);
    console.log(`connection time: ${connectionMs.toFixed(0)}ms`);
    console.log(`connection ramp: ${CONNECT_BATCH_SIZE} clients every ${CONNECT_BATCH_DELAY_MS}ms`);
    console.log(`connection rate: ${(connected / (connectionMs / 1000)).toFixed(1)} clients/sec`);
    console.log(`broadcasts: ${BROADCAST_COUNT}`);
    console.log(`deliveries: ${received}/${expectedDeliveries}`);
    console.log(`fanout completion: ${fanoutMs.toFixed(0)}ms`);
    console.log(`delivery latency p50/p95/p99: ${percentile(latencies, 0.50)}ms / ${percentile(latencies, 0.95)}ms / ${percentile(latencies, 0.99)}ms`);

    if (connected !== CLIENT_COUNT || received !== expectedDeliveries) {
      throw new Error('Chat load test did not meet delivery requirements');
    }
  } finally {
    for (const client of clients) client.disconnect();
    await socketService.close();
    if (httpServer.listening) {
      await new Promise<void>((resolve, reject) => httpServer.close(error => error ? reject(error) : resolve()));
    }
  }
}

run().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
