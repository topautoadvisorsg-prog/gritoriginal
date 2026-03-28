import 'dotenv/config';
/**
 * Production entry point.
 * Imports both server modules — each auto-starts when imported.
 * Admin server (port ADMIN_PORT / 3002) starts first so the user
 * server's /api/admin proxy can reach it immediately.
 */
import './admin-server';
import './user-server';
