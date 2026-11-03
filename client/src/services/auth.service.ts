import { timingSafeEqual } from 'node:crypto';
import { signSession, verifySession } from '@/adapters/session/session.adapter';
import { Env } from '@/interfaces/env.interface';

const passwordMatches = (given: string, expected: string): boolean => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

// Returns a signed session token for the right password, or null.
export const login = async (password: string, env: Env): Promise<string | null> => {
  if (!passwordMatches(password, env.DASHBOARD_PASSWORD)) return null;
  return signSession(env.SESSION_SECRET);
};

// Used by both the proxy and every data read, so the proxy is never the only gate.
export const hasValidSession = async (token: string | undefined, env: Env): Promise<boolean> =>
  token !== undefined && verifySession(token, env.SESSION_SECRET);
