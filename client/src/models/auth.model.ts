import { isAxiosError } from 'axios';
import { logger } from '@/adapters/logger/logger.adapter';
import { AUTH_LOGIN_ENDPOINT } from '@/constants/api.constant';
import { STRINGS } from '@/constants/strings.constant';
import { ApiResponse } from '@/interfaces/api.interface';
import { LoginBody } from '@/interfaces/auth.interface';
import { api } from '@/utils/api.utils';

export const AuthModel = {
  login: async (body: LoginBody): Promise<ApiResponse> => {
    try {
      const res = await api.post<ApiResponse>(AUTH_LOGIN_ENDPOINT, body);
      return res.data;
    } catch (error) {
      if (!isAxiosError(error)) throw error;
      // Network failure: no envelope came back, so build one for the screen.
      logger.error('Login request failed', { code: error.code });
      return { status: 'failed', message: STRINGS.common.networkError };
    }
  },
};
