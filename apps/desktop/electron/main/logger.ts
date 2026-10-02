import { redact, type LogEntry, type LogLevel } from '@ria/shared';

const RING_SIZE = 200;
const ring: LogEntry[] = [];

function record(level: LogLevel, scope: string, message: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = {
    time: new Date().toISOString(),
    level,
    scope,
    message,
    ...(data ? { data: redact(data) as Record<string, unknown> } : {}),
  };
  ring.push(entry);
  if (ring.length > RING_SIZE) ring.shift();
  const line = `[${entry.time}] ${level.toUpperCase()} (${scope}) ${message}`;
  if (level === 'error') console.error(line, entry.data ?? '');
  else if (level === 'warn') console.warn(line, entry.data ?? '');
  else console.log(line, entry.data ?? '');
}

export const logger = {
  debug: (scope: string, message: string, data?: Record<string, unknown>) => record('debug', scope, message, data),
  info: (scope: string, message: string, data?: Record<string, unknown>) => record('info', scope, message, data),
  warn: (scope: string, message: string, data?: Record<string, unknown>) => record('warn', scope, message, data),
  error: (scope: string, message: string, data?: Record<string, unknown>) => record('error', scope, message, data),
  /** A redacted copy of the recent log ring, for diagnostics export. */
  snapshot: (): LogEntry[] => ring.map((entry) => ({ ...entry })),
};
