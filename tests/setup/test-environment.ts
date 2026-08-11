// Force every Vitest worker onto inert local-only configuration before server
// modules load dotenv. Never let unit tests inherit developer or production
// database credentials from a local environment file.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://ci:ci@127.0.0.1:1/grit_ci';
process.env.SESSION_SECRET = 'ci-only-session-secret-never-used-outside-tests';
