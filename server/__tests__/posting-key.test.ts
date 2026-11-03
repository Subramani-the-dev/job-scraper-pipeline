import { buildIdentityKey, normalizeUrl } from '../src/helpers/posting-key.helper';

describe('buildIdentityKey', () => {
  it('prefixes the external id with the source kind', () => {
    expect(buildIdentityKey('WORKDAY', 'JR-123', 'https://x.example/job/1')).toBe('WORKDAY:JR-123');
  });

  it('falls back to the normalized URL when there is no external id', () => {
    expect(buildIdentityKey('CUSTOM_HTML', null, 'https://X.example/jobs/1/?utm_source=a#top')).toBe(
      'https://x.example/jobs/1',
    );
  });
});

describe('normalizeUrl', () => {
  it('lowercases host, drops fragment, tracking params and trailing slash', () => {
    expect(normalizeUrl('https://Jobs.Example.com/a/b/?utm_campaign=x&id=7#frag')).toBe('https://jobs.example.com/a/b?id=7');
  });

  it('rejects an invalid URL', () => {
    expect(() => normalizeUrl('not a url')).toThrow();
  });
});

describe('normalizeUrl query order', () => {
  it('produces the same key regardless of query param order', () => {
    expect(normalizeUrl('https://a.example/j?b=2&a=1')).toBe(normalizeUrl('https://a.example/j?a=1&b=2'));
  });
});
