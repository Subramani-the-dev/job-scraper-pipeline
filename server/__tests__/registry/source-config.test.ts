import { validateSourceConfig } from '../../src/helpers/source-config.helper';

describe('validateSourceConfig', () => {
  it('accepts a valid WORKDAY config', () => {
    expect(validateSourceConfig('WORKDAY', { host: 'citi.wd5.myworkdayjobs.com', tenant: 'citi', site: '2' })).toEqual({
      host: 'citi.wd5.myworkdayjobs.com',
      tenant: 'citi',
      site: '2',
    });
  });

  it('accepts a valid GREENHOUSE config', () => {
    expect(validateSourceConfig('GREENHOUSE', { boardToken: 'sigmoid' })).toEqual({ boardToken: 'sigmoid' });
  });

  it('rejects a config missing a required field for its kind', () => {
    expect(() => validateSourceConfig('WORKDAY', { host: 'a.example.com' })).toThrow(/tenant/);
  });

  it('rejects a config shaped for a different kind', () => {
    expect(() => validateSourceConfig('GREENHOUSE', { tenant: 'citi', site: '2', host: 'h' })).toThrow();
  });

  it('rejects unknown extra keys', () => {
    expect(() => validateSourceConfig('GREENHOUSE', { boardToken: 'a', extra: 1 })).toThrow(/extra/);
  });
});
