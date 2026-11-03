import { NextRequest, NextResponse } from 'next/server';
import { LOGIN_API_PATH } from '@/constants/api.constant';
import { LOGIN_PATH, SESSION_COOKIE } from '@/constants/auth.constant';
import { STRINGS } from '@/constants/strings.constant';
import { getEnv } from '@/helpers/env.helper';
import { ApiResponse } from '@/interfaces/api.interface';
import { hasValidSession } from '@/services/auth.service';

const PUBLIC_PATHS = new Set([LOGIN_PATH, LOGIN_API_PATH]);

// Optimistic gate only: every data read also calls hasValidSession itself.
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await hasValidSession(token, getEnv())) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json<ApiResponse>({ status: 'failed', message: STRINGS.auth.unauthorized }, { status: 401 });
  }
  return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
