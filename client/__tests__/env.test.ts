import { validateEnv } from '@/helpers/env.helper';

const validEnv: Record<string, string | undefined> = {
  DATABASE_URL: 'postgresql://u:p@host/db',
  DASHBOARD_PASSWORD: 'pw',
  SESSION_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('returns typed config when all required keys are present', () => {
    expect(validateEnv(validEnv).DASHBOARD_PASSWORD).toBe('pw');
  });

  it('throws naming every missing key', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL.*DASHBOARD_PASSWORD.*SESSION_SECRET/);
  });
});
