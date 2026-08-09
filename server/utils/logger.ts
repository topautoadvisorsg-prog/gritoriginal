type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'debug';

function getTimestamp(): string {
  return new Date().toISOString();
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel): string {
  return `[${getTimestamp()}] [${level.toUpperCase()}]`;
}

const SENSITIVE_KEY = /^(authorization|proxy[_-]?authorization|cookie|set[_-]?cookie|password|passphrase|secret|client[_-]?secret|api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token|session[_-]?token|auth[_-]?token|config[_-]?value)$/i;
const ASSIGNED_SECRET = /((?:authorization|cookie|password|secret|token|api[_-]?key|config[_-]?value)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;}]+)/gi;
const BEARER_TOKEN = /\bBearer\s+[^\s,;]+/gi;
const DATABASE_CREDENTIALS = /\b(postgres(?:ql)?):\/\/[^@\s]+@/gi;
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

function redactString(value: string): string {
  return value
    .replace(BEARER_TOKEN, 'Bearer [REDACTED]')
    .replace(DATABASE_CREDENTIALS, '$1://[REDACTED]@')
    .replace(JWT, '[REDACTED_JWT]')
    .replace(ASSIGNED_SECRET, '$1[REDACTED]');
}

export function redactLogValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') return redactString(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
    };
  }
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map(item => redactLogValue(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[REDACTED]' : redactLogValue(item, seen),
    ]),
  );
}

function safeArgs(args: unknown[]): unknown[] {
  return args.map(arg => redactLogValue(arg));
}

export const logger = {
  debug(...args: unknown[]): void {
    if (!shouldLog('debug')) return;
    console.log(formatMessage('debug'), ...safeArgs(args));
  },

  info(...args: unknown[]): void {
    if (!shouldLog('info')) return;
    console.log(formatMessage('info'), ...safeArgs(args));
  },

  warn(...args: unknown[]): void {
    if (!shouldLog('warn')) return;
    console.warn(formatMessage('warn'), ...safeArgs(args));
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    if (!shouldLog('error')) return;
    console.error(formatMessage('error'), ...safeArgs([message, { error, ...context }]));
  },

  metric(name: string, value: number = 1, tags?: Record<string, string | number>): void {
    // Simple console metric for now
    if (!shouldLog('info')) return;
    console.log(`[METRIC] ${name}=${value}`, tags ? JSON.stringify(redactLogValue(tags)) : '');
  }
};
