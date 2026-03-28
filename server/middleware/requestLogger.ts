import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Capture original end/json methods to intercept response body and status
  const originalEnd = res.end;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req as any).user?.id || null;
    
    // Only log API routes
    if (req.path.startsWith('/api')) {
      const logData = {
        route: req.path,
        method: req.method,
        userId,
        status: res.statusCode,
        duration,
        error: res.locals.error || null,
        body: res.statusCode >= 400 ? req.body : undefined // sanitize body for successful requests
      };

      if (res.statusCode >= 500) {
        logger.error(JSON.stringify(logData));
      } else if (res.statusCode >= 400) {
        logger.warn(JSON.stringify(logData));
      } else {
        logger.info(JSON.stringify(logData));
      }
    }
  });

  next();
}
