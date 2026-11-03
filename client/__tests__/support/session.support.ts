import { POST } from '@/app/api/v1/auth/login/route';

export const TEST_PASSWORD = 'correct-horse';
export const TEST_SECRET = 's'.repeat(32);

// getEnv() caches on first read, so set the env before any test touches it.
export const setTestEnv = (): void => {
  process.env.DATABASE_URL = 'postgresql://u:p@host/db';
  process.env.DASHBOARD_PASSWORD = TEST_PASSWORD;
  process.env.SESSION_SECRET = TEST_SECRET;
};

export const loginRequest = (body: unknown): Request =>
  new Request('http://localhost/api/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

// A real session token, obtained the way a browser would: by logging in.
export const loginToken = async (): Promise<string> => {
  const res = await POST(loginRequest({ password: TEST_PASSWORD }));
  return /session=([^;]+)/.exec(res.headers.get('set-cookie') ?? '')?.[1] ?? '';
};
