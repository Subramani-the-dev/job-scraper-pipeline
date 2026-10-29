import 'dotenv/config';
import pino from 'pino';
import { createApp } from './app';
import { validateEnv } from './helpers/env.helper';

const logger = pino();
const env = validateEnv(process.env);

createApp(env.CORS_ORIGIN).listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Server listening');
});
