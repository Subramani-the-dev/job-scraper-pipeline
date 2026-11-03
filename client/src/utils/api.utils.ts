import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_PATH, MAX_RETRIES } from '@/constants/api.constant';

// Auth is an httpOnly session cookie sent automatically on same-origin requests,
// so there is no token to inject or refresh from client code.
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_PATH,
  // Every response carries the { status, data?, message? } envelope; callers read
  // `status` instead of catching on HTTP codes.
  validateStatus: () => true,
});

const attempts = new WeakMap<InternalAxiosRequestConfig, number>();

// Retry transient network failures on idempotent requests only.
api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const { config } = error;
  const count = config ? (attempts.get(config) ?? 0) : MAX_RETRIES;
  if (!config || config.method !== 'get' || count >= MAX_RETRIES) throw error;
  attempts.set(config, count + 1);
  return api.request(config);
});
