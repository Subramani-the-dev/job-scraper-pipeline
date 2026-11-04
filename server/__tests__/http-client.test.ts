import { createHttpClient } from '../src/adapters/http/http.adapter';
import { FetchLike } from '../src/interfaces/http.interface';
import { ScrapeError } from '../src/helpers/scrape-error.helper';

const PAGE = 'https://boards-api.greenhouse.io/v1/boards/acme/jobs';
const ROBOTS = 'https://boards-api.greenhouse.io/robots.txt';

interface Reply {
  status: number;
  body: string;
}

// Routes each URL to a queue of replies (last one repeats); `Error` entries simulate network failures.
const fakeFetch = (routes: Record<string, (Reply | Error)[]>): { fetch: FetchLike; calls: string[] } => {
  const calls: string[] = [];
  const fetch: FetchLike = async (url) => {
    calls.push(url);
    const queue = routes[url];
    if (!queue || queue.length === 0) throw new Error(`unexpected ${url}`);
    const next = queue.length > 1 ? queue.shift() : queue[0];
    if (next instanceof Error) throw next;
    return { status: next?.status ?? 500, text: async () => next?.body ?? '' };
  };
  return { fetch, calls };
};

const noRobots: Reply = { status: 404, body: '' };

const build = (fetch: FetchLike, overrides: { random?: () => number; timeoutMs?: number } = {}) => {
  const sleeps: number[] = [];
  const client = createHttpClient({
    fetch,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    random: overrides.random ?? (() => 0.5),
    timeoutMs: overrides.timeoutMs ?? 1000,
    retries: 2,
    userAgent: 'job-scraper-pipeline/1.0',
  });
  return { client, sleeps };
};

describe('createHttpClient', () => {
  it('waits between 2 and 5 seconds before every request', async () => {
    const { fetch } = fakeFetch({ [ROBOTS]: [noRobots], [PAGE]: [{ status: 200, body: 'ok' }] });
    const low = build(fetch, { random: () => 0 });
    await low.client.get(PAGE);
    expect(low.sleeps).toEqual([2000, 2000]);

    const high = build(fetch, { random: () => 0.999 });
    await high.client.get(PAGE);
    expect(high.sleeps.every((ms) => ms >= 2000 && ms <= 5000)).toBe(true);
  });

  it('returns the status and body of a successful request', async () => {
    const { fetch } = fakeFetch({ [ROBOTS]: [noRobots], [PAGE]: [{ status: 200, body: '{"jobs":[]}' }] });
    await expect(build(fetch).client.get(PAGE)).resolves.toEqual({ status: 200, body: '{"jobs":[]}' });
  });

  it('refuses a route robots.txt disallows as blocked, without requesting it', async () => {
    const { fetch, calls } = fakeFetch({ [ROBOTS]: [{ status: 200, body: 'User-agent: *\nDisallow: /v1/' }] });
    const request = build(fetch).client.get(PAGE);
    await expect(request).rejects.toBeInstanceOf(ScrapeError);
    await expect(request).rejects.toMatchObject({ kind: 'blocked' });
    expect(calls).toEqual([ROBOTS]);
  });

  it('fetches robots.txt once per origin', async () => {
    const { fetch, calls } = fakeFetch({ [ROBOTS]: [noRobots], [PAGE]: [{ status: 200, body: 'ok' }] });
    const { client } = build(fetch);
    await client.get(PAGE);
    await client.get(PAGE);
    expect(calls.filter((url) => url === ROBOTS)).toHaveLength(1);
  });

  it('retries a 5xx or network error and returns the eventual success', async () => {
    const { fetch, calls } = fakeFetch({
      [ROBOTS]: [noRobots],
      [PAGE]: [{ status: 503, body: '' }, new Error('ECONNRESET'), { status: 200, body: 'ok' }],
    });
    await expect(build(fetch).client.get(PAGE)).resolves.toEqual({ status: 200, body: 'ok' });
    expect(calls.filter((url) => url === PAGE)).toHaveLength(3);
  });

  it('fails as network once retries are exhausted', async () => {
    const { fetch, calls } = fakeFetch({ [ROBOTS]: [noRobots], [PAGE]: [new Error('ECONNRESET')] });
    await expect(build(fetch).client.get(PAGE)).rejects.toMatchObject({ kind: 'network' });
    expect(calls.filter((url) => url === PAGE)).toHaveLength(3);
  });

  it('does not retry a 4xx response', async () => {
    const { fetch, calls } = fakeFetch({ [ROBOTS]: [noRobots], [PAGE]: [{ status: 403, body: 'denied' }] });
    await expect(build(fetch).client.get(PAGE)).resolves.toEqual({ status: 403, body: 'denied' });
    expect(calls.filter((url) => url === PAGE)).toHaveLength(1);
  });

  it('aborts a request that exceeds the timeout and fails as network', async () => {
    const hanging: FetchLike = (url, init) =>
      url === ROBOTS
        ? Promise.resolve({ status: 404, text: async () => '' })
        : new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
    await expect(build(hanging, { timeoutMs: 10 }).client.get(PAGE)).rejects.toMatchObject({ kind: 'network' });
  });

  it('fails as network when robots.txt is unavailable', async () => {
    const { fetch } = fakeFetch({ [ROBOTS]: [{ status: 503, body: '' }] });
    await expect(build(fetch).client.get(PAGE)).rejects.toMatchObject({ kind: 'network' });
  });
});
