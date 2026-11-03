import { isPathAllowed } from '../../src/helpers/robots.helper';

const UA = 'job-pipeline-bot/1.0';

describe('isPathAllowed', () => {
  it('allows everything when robots.txt is 404', () => {
    expect(isPathAllowed({ status: 404, body: '' }, UA, '/anything')).toBe(true);
  });

  it('treats other 4xx as allowed', () => {
    expect(isPathAllowed({ status: 401, body: '' }, UA, '/anything')).toBe(true);
  });

  it('uses the User-agent: * group when none names our token', () => {
    const body = 'User-agent: *\nDisallow: /services/';
    expect(isPathAllowed({ status: 200, body }, UA, '/services/recruiting/v1/jobs')).toBe(false);
    expect(isPathAllowed({ status: 200, body }, UA, '/search/')).toBe(true);
  });

  it('prefers the group naming our token over *', () => {
    const body = 'User-agent: *\nDisallow: /\n\nUser-agent: job-pipeline-bot\nAllow: /';
    expect(isPathAllowed({ status: 200, body }, UA, '/jobs')).toBe(true);
  });

  it('longest match wins and Allow wins ties', () => {
    const body = 'User-agent: *\nDisallow: /\nAllow: /api/pcsx';
    expect(isPathAllowed({ status: 200, body }, UA, '/api/pcsx/search')).toBe(true);
    expect(isPathAllowed({ status: 200, body }, UA, '/other')).toBe(false);
  });

  it('throws on 5xx so the caller treats the host as unreachable', () => {
    expect(() => isPathAllowed({ status: 503, body: '' }, UA, '/x')).toThrow();
  });
});

describe('isPathAllowed edge cases', () => {
  it('throws on a redirected robots.txt', () => {
    expect(() => isPathAllowed({ status: 301, body: '' }, UA, '/x')).toThrow(/redirect/);
  });

  it('merges multiple groups for the same agent', () => {
    const body = 'User-agent: job-pipeline-bot\nAllow: /a\n\nUser-agent: job-pipeline-bot\nDisallow: /b';
    expect(isPathAllowed({ status: 200, body }, UA, '/b/1')).toBe(false);
  });
});
