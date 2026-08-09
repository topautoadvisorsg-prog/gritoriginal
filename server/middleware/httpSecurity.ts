import express, { type Express } from 'express';
import helmet from 'helmet';

export const DEFAULT_JSON_BODY_LIMIT = '1mb';
export const IMPORT_JSON_BODY_LIMIT = '5mb';

const LARGE_IMPORT_PATHS = [
  '/api/fighters/bulk',
  '/api/fights/bulk',
  '/api/fighters/:id/import-history',
];

/**
 * Conservative headers that are compatible with the current SPA and Clerk
 * popup flow. CSP and HSTS stay disabled until domain/provider compatibility is
 * verified in a dedicated staging gate.
 */
export function configureHttpSecurity(app: Express, nodeEnv?: string): void {
  app.disable('x-powered-by');
  app.set('trust proxy', nodeEnv === 'production' ? 1 : false);

  app.use(helmet({
    contentSecurityPolicy: false,
    strictTransportSecurity: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xFrameOptions: { action: 'sameorigin' },
  }));

  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
}

/** Apply narrow import exceptions before the conservative global JSON parser. */
export function registerJsonBodyParsers(app: Express): void {
  app.use(LARGE_IMPORT_PATHS, express.json({ limit: IMPORT_JSON_BODY_LIMIT }));
  app.use(express.json({ limit: DEFAULT_JSON_BODY_LIMIT }));
}
