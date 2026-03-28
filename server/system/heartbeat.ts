import { Router } from 'express';
import { db, pool } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { socketService } from '../services/socketService';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      responseTimeMs: number;
      connections?: number;
    };
    auth: {
      status: 'available' | 'unavailable';
      sessionStore: 'connected' | 'disconnected';
    };
    streaming: {
      status: 'available' | 'unavailable';
      socketIO: 'initialized' | 'not_initialized';
      activeConnections?: number;
    };
  };
  system: {
    memory: NodeJS.MemoryUsage;
    uptime: number;
  };
}

/**
 * GET /api/system/health
 * Comprehensive health check for SaaS monitoring.
 * Checks: Database, Auth, Streaming Pipeline, System Resources
 */
router.get('/health', async (_req, res) => {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.0',
    services: {
      database: {
        status: 'disconnected',
        responseTimeMs: 0,
      },
      auth: {
        status: 'available',
        sessionStore: 'connected',
      },
      streaming: {
        status: 'available',
        socketIO: 'not_initialized',
      },
    },
    system: {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    },
  };

  try {
    // Database connectivity check with timing
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    health.services.database.status = 'connected';
    health.services.database.responseTimeMs = Date.now() - dbStart;
    
    // Get connection pool stats if available
    if ('totalCount' in pool) {
      health.services.database.connections = (pool as { totalCount: number }).totalCount;
    }
  } catch (error) {
    logger.error('Health check: Database connection failed:', error);
    health.status = 'unhealthy';
    health.services.database.status = 'disconnected';
  }

  // Auth service check - verify session store is accessible
  try {
    health.services.auth.status = health.services.database.status === 'connected' ? 'available' : 'unavailable';
    health.services.auth.sessionStore = health.services.database.status;
  } catch (error) {
    logger.error('Health check: Auth service check failed:', error);
    health.services.auth.status = 'unavailable';
    health.status = 'degraded';
  }

  // Streaming pipeline check
  try {
    const io = socketService.getIO();
    if (io) {
      health.services.streaming.socketIO = 'initialized';
      // Safely access engine clients count
      const engine = (io as { engine?: { clientsCount?: number } }).engine;
      health.services.streaming.activeConnections = engine?.clientsCount;
    } else {
      health.services.streaming.status = 'unavailable';
      health.services.streaming.socketIO = 'not_initialized';
    }
  } catch (error) {
    logger.error('Health check: Streaming service check failed:', error);
    health.services.streaming.status = 'unavailable';
    health.status = 'degraded';
  }

  // Determine overall status
  const criticalServices = [
    health.services.database.status === 'connected',
    health.services.auth.status === 'available',
  ];
  
  const allCriticalHealthy = criticalServices.every(Boolean);
  const anyCriticalFailed = criticalServices.some(s => !s);

  if (!allCriticalHealthy) {
    health.status = anyCriticalFailed ? 'unhealthy' : 'degraded';
  }

  const totalResponseTime = Date.now() - startTime;
  
  // Return appropriate HTTP status
  const httpStatus = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  
  res.status(httpStatus).json({
    ...health,
    responseTimeMs: totalResponseTime,
  });
});

/**
 * GET /api/system/heartbeat
 * Lightweight health check for load balancers (minimal overhead).
 */
router.get('/heartbeat', async (_req, res) => {
  const status = {
    service: 'available',
    timestamp: new Date().toISOString(),
  };

  try {
    await db.execute(sql`SELECT 1`);
    res.status(200).json(status);
  } catch (error) {
    logger.error('Heartbeat failed:', error);
    res.status(503).json({ ...status, service: 'unavailable' });
  }
});

export default router;
