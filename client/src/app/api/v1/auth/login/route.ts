import { NextResponse } from 'next/server';
import { logger } from '@/adapters/logger/logger.adapter';
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/constants/auth.constant';
import { STRINGS } from '@/constants/strings.constant';
import { getEnv } from '@/helpers/env.helper';
import { ApiResponse } from '@/interfaces/api.interface';
import { login } from '@/services/auth.service';
import { loginSchema } from '@/validations/login.validation';

const fail = (status: number, message: string): NextResponse<ApiResponse> =>
  NextResponse.json({ status: 'failed', message }, { status });

const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch (error) {
    logger.warn('Login body is not valid JSON', { reason: error instanceof Error ? error.name : 'unknown' });
    return null;
  }
};

export async function POST(request: Request): Promise<NextResponse<ApiResponse>> {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(400, STRINGS.auth.passwordRequired);

  const token = await login(parsed.data.password, getEnv());
  if (!token) return fail(401, STRINGS.auth.wrongPassword);

  const res = NextResponse.json<ApiResponse>({ status: 'success' });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
