import { SignJWT, jwtVerify } from 'jose';
import { logger } from '@/adapters/logger/logger.adapter';
import { SESSION_TTL_SECONDS } from '@/constants/auth.constant';

const key = (secret: string): Uint8Array => new TextEncoder().encode(secret);

export const signSession = async (secret: string): Promise<string> =>
  new SignJWT({ role: 'owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key(secret));

export const verifySession = async (token: string, secret: string): Promise<boolean> => {
  try {
    await jwtVerify(token, key(secret), { algorithms: ['HS256'] });
    return true;
  } catch (error) {
    // Invalid, tampered or expired token: treated as logged out. Log the reason only, never the token.
    logger.warn('Session rejected', { reason: error instanceof Error ? error.name : 'unknown' });
    return false;
  }
};
