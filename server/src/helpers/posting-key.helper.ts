const TRACKING_PARAM = /^(utm_|fbclid$|gclid$|ref$)/i;

export const normalizeUrl = (raw: string): string => {
  const url = new URL(raw);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAM.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
  const query = url.searchParams.toString();
  return `${url.protocol}//${url.host}${path}${query ? `?${query}` : ''}`;
};

export const buildIdentityKey = (kind: string, externalId: string | null, url: string): string =>
  externalId ? `${kind}:${externalId}` : normalizeUrl(url);
