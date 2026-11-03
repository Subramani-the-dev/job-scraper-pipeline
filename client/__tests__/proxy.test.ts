// @vitest-environment node
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { loginToken, setTestEnv } from './support/session.support';

setTestEnv();

const request = (path: string, session?: string): NextRequest =>
  new NextRequest(`http://localhost${path}`, {
    headers: session ? { cookie: `session=${session}` } : {},
  });

const passesThrough = (res: Response): boolean => res.headers.get('x-middleware-next') === '1';

describe('proxy', () => {
  it('redirects a page request without a cookie to /login', async () => {
    const res = await proxy(request('/'));

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location') ?? '').pathname).toBe('/login');
  });

  it('answers an API request without a cookie with a 401 envelope', async () => {
    const res = await proxy(request('/api/v1/postings'));

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ status: 'failed' });
  });

  it('rejects a tampered cookie', async () => {
    const token = await loginToken();
    const tampered = token.slice(0, -2) + (token.endsWith('AA') ? 'BB' : 'AA');

    const res = await proxy(request('/api/v1/postings', tampered));

    expect(res.status).toBe(401);
  });

  it('lets a request with a valid session through', async () => {
    const res = await proxy(request('/', await loginToken()));

    expect(passesThrough(res)).toBe(true);
  });

  it.each(['/login', '/api/v1/auth/login'])('leaves %s public', async (path) => {
    expect(passesThrough(await proxy(request(path)))).toBe(true);
  });
});
