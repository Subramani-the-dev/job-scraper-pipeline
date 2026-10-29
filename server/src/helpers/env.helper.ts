import Joi from 'joi';
import { Env } from '../interfaces/env.interface';

const envSchema = Joi.object<Env>({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(4000),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),
  TELEGRAM_BOT_TOKEN: Joi.string().required(),
  TELEGRAM_CHAT_ID: Joi.string().required(),
}).unknown(true);

export const validateEnv = (source: Record<string, string | undefined>): Env => {
  const { error, value } = envSchema.validate(source, { abortEarly: false });
  if (error) {
    const details = error.details.map((detail) => detail.message).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return value;
};
