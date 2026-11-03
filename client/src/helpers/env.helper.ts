import { z } from 'zod';
import { Env } from '@/interfaces/env.interface';
import { formatZodIssues } from '@/utils/functions.utils';

const envSchema: z.ZodType<Env> = z.object({
  DATABASE_URL: z.string().min(1),
  DASHBOARD_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
});

export const validateEnv = (source: Record<string, string | undefined>): Env => {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${formatZodIssues(result.error)}`);
  }
  return result.data;
};

let cached: Env | undefined;

// Parsed once per process (instrumentation.ts already crashes startup on a bad env);
// request paths call this instead of re-parsing process.env every time.
export const getEnv = (): Env => {
  cached ??= validateEnv(process.env);
  return cached;
};
