import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { API_PREFIX } from './constants/app.constant';
import { errorHandler, notFoundHandler } from './helpers/error.helper';
import healthRoute from './routes/health.route';

export const createApp = (corsOrigin: string): Express => {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  app.use(`${API_PREFIX}/health`, healthRoute);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
