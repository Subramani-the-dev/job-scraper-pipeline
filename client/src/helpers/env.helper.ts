import Joi from 'joi';
import { Env } from '@/interfaces/env.interface';

const envSchema = Joi.object<Env>({
  DATABASE_URL: Joi.string().required(),
  DASHBOARD_PASSWORD: Joi.string().required(),
  SESSION_SECRET: Joi.string().min(32).required(),
}).unknown(true);

export const validateEnv = (source: Record<string, string | undefined>): Env => {
  const { error, value } = envSchema.validate(source, { abortEarly: false });
  if (error) {
    const details = error.details.map((detail) => detail.message).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return value;
};
