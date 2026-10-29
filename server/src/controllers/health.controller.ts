import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/response.interface';

export const getHealth = (_req: Request, res: Response<ApiResponse<{ uptime: number }>>): void => {
  res.status(200).json({ status: 'success', data: { uptime: process.uptime() } });
};
