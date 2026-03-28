import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// Standard limiters
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

export const strictApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

export const authApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Unified AI/Chat limiter - all AI and chat endpoints use this
export const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI chat rate limit exceeded. Please try again later.' },
  handler: (req, res, _next, options) => {
    logger.warn(`Rate limit exceeded for AI/chat endpoint: ${req.path}`, {
      ip: req.ip,
      userId: req.user?.id,
    });
    res.status(429).json(options.message);
  },
});

// Stricter limiter for streaming endpoints
export const streamingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 streaming requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Streaming rate limit exceeded. Please wait before starting a new chat.' },
});
