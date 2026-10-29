export interface ApiResponse<T> {
  status: 'success' | 'failed' | 'noContent';
  data?: T;
  message?: string;
}
