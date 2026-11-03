// Central logger: the one place that writes to the console. Swap the sink here
// (e.g. a hosted log service) without touching callers. Never pass secrets or tokens.
type LogContext = Record<string, unknown>;

const write = (level: 'info' | 'warn' | 'error', message: string, context?: LogContext): void => {
  const entry = { level, message, ...context, time: new Date().toISOString() };
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.info(entry);
};

export const logger = {
  info: (message: string, context?: LogContext): void => write('info', message, context),
  warn: (message: string, context?: LogContext): void => write('warn', message, context),
  error: (message: string, context?: LogContext): void => write('error', message, context),
};
