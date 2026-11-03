// @vitest-environment node
import { renderToStaticMarkup } from 'react-dom/server';
import DashboardScreen from '@/screens/dashboard/dashboard.screen';
import { loginToken, setTestEnv } from './support/session.support';

setTestEnv();
let sessionCookie: string | undefined;

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => (sessionCookie ? { value: sessionCookie } : undefined) }),
}));
vi.mock('next/navigation', () => ({
  redirect: (path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
// Database boundary: the only thing faked is the query result.
vi.mock('@/adapters/db/prisma.adapter', () => ({
  prisma: { posting: { count: vi.fn(async () => 7) } },
}));

beforeEach(() => {
  sessionCookie = undefined;
  vi.clearAllMocks();
});

describe('DashboardScreen', () => {
  it('shows the open posting count from the database for a logged-in user', async () => {
    sessionCookie = await loginToken();

    const html = renderToStaticMarkup(await DashboardScreen());

    expect(html).toContain('7 open postings');
  });

  it('redirects to /login without reading data when the session is invalid', async () => {
    sessionCookie = 'not-a-jwt';
    const { prisma } = await import('@/adapters/db/prisma.adapter');

    await expect(DashboardScreen()).rejects.toThrow('REDIRECT:/login');
    expect(prisma.posting.count).not.toHaveBeenCalled();
  });
});
