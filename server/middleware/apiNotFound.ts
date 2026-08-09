import type { RequestHandler } from 'express';

/** Keep unknown API requests inside the JSON boundary instead of the SPA shell. */
export const apiNotFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Not Found' });
};
