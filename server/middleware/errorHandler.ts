import type { ErrorRequestHandler } from 'express';
import { logger } from '../utils/logger';

type HttpError = Error & { status?: number; statusCode?: number };

/** Terminal API error boundary. It logs details but never leaks 5xx internals. */
export const apiErrorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  logger.error('Unhandled API error', error);

  const httpError = error instanceof Error ? error as HttpError : undefined;
  const requestedStatus = httpError?.statusCode ?? httpError?.status;
  const status = requestedStatus && requestedStatus >= 400 && requestedStatus < 600
    ? requestedStatus
    : 500;

  res.status(status).json({
    message: status < 500 && httpError?.message
      ? httpError.message
      : 'Internal Server Error',
  });
};
