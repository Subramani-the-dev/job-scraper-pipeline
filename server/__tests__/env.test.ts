import { validateEnv } from '../src/helpers/env.helper';

const validEnv: Record<string, string | undefined> = {
  DATABASE_URL: 'postgresql://u:p@host/db',
  DIRECT_URL: 'postgresql://u:p@host/db',
  TELEGRAM_BOT_TOKEN: 'token',
  TELEGRAM_CHAT_ID: '1',
};

describe('validateEnv', () => {
  it('returns typed config when all required keys are present', () => {
    expect(validateEnv(validEnv).DATABASE_URL).toBe(validEnv.DATABASE_URL);
  });

  it('throws naming every missing key', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL.*TELEGRAM_CHAT_ID/);
  });
});
