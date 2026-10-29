import { NextFunction, Request, Response } from 'express';
import pino from 'pino';
import { ApiResponse } from '../interfaces/response.interface';

const logger = pino();

export const notFoundHandler = (_req: Request, res: Response<ApiResponse<never>>): void => {
  res.status(404).json({ status: 'failed', message: 'Route not found' });
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response<ApiResponse<never>>,
  _next: NextFunction,
): void => {
  logger.error({ err }, 'Unhandled request error');
  const isBadBody = typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed';
  res.status(isBadBody ? 400 : 500).json({
    status: 'failed',
    message: isBadBody ? 'Malformed request body' : 'Internal server error',
  });
};
