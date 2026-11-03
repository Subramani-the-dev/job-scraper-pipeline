// @vitest-environment node
import { POST } from '@/app/api/v1/auth/login/route';
import { TEST_PASSWORD, loginRequest, setTestEnv } from './support/session.support';

setTestEnv();

describe('POST /api/v1/auth/login', () => {
  it('sets an httpOnly session cookie for the right password', async () => {
    const res = await POST(loginRequest({ password: TEST_PASSWORD }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'success' });
    const cookie = res.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/^session=[\w-]+\.[\w-]+\.[\w-]+;/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('rejects a wrong password with 401 and no cookie', async () => {
    const res = await POST(loginRequest({ password: 'nope' }));

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ status: 'failed' });
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('rejects a missing password with 400', async () => {
    const res = await POST(loginRequest({}));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ status: 'failed' });
  });
});
