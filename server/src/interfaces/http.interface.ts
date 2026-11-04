export interface HttpResponse {
  status: number;
  body: string;
}

export interface HttpClient {
  get: (url: string) => Promise<HttpResponse>;
}

export interface FetchInit {
  signal: AbortSignal;
  headers: Record<string, string>;
}

export interface FetchReply {
  status: number;
  text: () => Promise<string>;
}

export type FetchLike = (url: string, init: FetchInit) => Promise<FetchReply>;

export interface HttpClientOptions {
  fetch: FetchLike;
  sleep: (ms: number) => Promise<void>;
  random: () => number;
  timeoutMs: number;
  retries: number;
  userAgent: string;
}
