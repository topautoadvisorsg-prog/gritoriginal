import 'dotenv/config';
/**
 * Production entry point — single server architecture.
 * All routes (user + admin) are mounted on the user-server,
 * which listens on process.env.PORT for single-port deployment compatibility.
 */
process.env.NODE_ENV = 'production';
await import('./user-server');
