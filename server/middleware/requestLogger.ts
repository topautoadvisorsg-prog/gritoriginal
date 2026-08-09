import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user?.id || null;
    
    // Only log API routes
    if (req.path.startsWith('/api')) {
      const logData = {
        route: req.path,
        method: req.method,
        userId,
        status: res.statusCode,
        duration,
      };

      if (res.statusCode >= 500) {
        logger.error('API request completed with server error', undefined, logData);
      } else if (res.statusCode >= 400) {
        logger.warn('API request completed with client error', logData);
      } else {
        logger.info('API request completed', logData);
      }
    }
  });

  next();
}
