export type ApiStatus = 'success' | 'failed' | 'noContent';

export interface ApiResponse<T = undefined> {
  status: ApiStatus;
  data?: T;
  message?: string;
}
