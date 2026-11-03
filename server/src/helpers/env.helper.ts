import { z } from 'zod';
import { Env } from '../interfaces/env.interface';
import { formatZodIssues } from '../utils/functions.utils';

const required = z.string().min(1);

const envSchema: z.ZodType<Env> = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: required.default('http://localhost:3000'),
  DATABASE_URL: required,
  DIRECT_URL: required,
  TELEGRAM_BOT_TOKEN: required,
  TELEGRAM_CHAT_ID: required,
});

export const validateEnv = (source: Record<string, string | undefined>): Env => {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${formatZodIssues(result.error)}`);
  }
  return result.data;
};
