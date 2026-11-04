import pino from 'pino';
import { HTTP_RETRIES, HTTP_TIMEOUT_MS, ROBOTS_USER_AGENT } from '../../constants/app.constant';
import { isPathAllowed } from '../../helpers/robots.helper';
import { ScrapeError } from '../../helpers/scrape-error.helper';
import { HttpClient, HttpClientOptions, HttpResponse } from '../../interfaces/http.interface';

const logger = pino();

const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 5000;

// The only path to the network for adapters: polite delay, timeout, retry, robots.txt per route.
// No proxy, stealth or CAPTCHA handling, by design: a refusal surfaces as `failed: blocked`.
export const createHttpClient = (options: HttpClientOptions): HttpClient => {
  const { fetch, sleep, random, timeoutMs, retries, userAgent } = options;
  const robotsByOrigin = new Map<string, HttpResponse>();

  const attempt = async (url: string): Promise<HttpResponse> => {
    await sleep(MIN_DELAY_MS + Math.floor(random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const reply = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': userAgent } });
      return { status: reply.status, body: await reply.text() };
    } finally {
      clearTimeout(timer);
    }
  };

  // Retries network errors and 5xx; any other status is the caller's to interpret.
  const request = async (url: string): Promise<HttpResponse> => {
    let lastError = '';
    for (let tryNo = 0; tryNo <= retries; tryNo += 1) {
      try {
        const res = await attempt(url);
        if (res.status < 500) return res;
        lastError = `HTTP ${res.status}`;
      } catch (err) {
        logger.warn({ err, url, tryNo }, 'Request attempt failed');
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
    throw new ScrapeError('network', `${url} failed after ${retries + 1} attempts: ${lastError}`);
  };

  const robotsFor = async (origin: string): Promise<HttpResponse> => {
    const cached = robotsByOrigin.get(origin);
    if (cached) return cached;
    let robots: HttpResponse;
    try {
      robots = await request(`${origin}/robots.txt`);
    } catch (err) {
      logger.warn({ err, origin }, 'robots.txt unreachable');
      // A robots.txt that keeps answering 5xx means "assume disallowed for now" (RFC 9309).
      robots = { status: 503, body: '' };
    }
    robotsByOrigin.set(origin, robots);
    return robots;
  };

  const assertAllowed = async (url: string): Promise<void> => {
    const target = new URL(url);
    const robots = await robotsFor(target.origin);
    let allowed: boolean;
    try {
      allowed = isPathAllowed(robots, userAgent, `${target.pathname}${target.search}`);
    } catch (err) {
      logger.warn({ err, origin: target.origin }, 'robots.txt unusable');
      throw new ScrapeError('network', `robots.txt for ${target.origin} is unusable`);
    }
    if (!allowed) throw new ScrapeError('blocked', `robots.txt disallows ${target.pathname}`);
  };

  return {
    get: async (url) => {
      await assertAllowed(url);
      return request(url);
    },
  };
};

// Production wiring: Node's fetch and a real timer, identified by the same token registry sync checked robots.txt with.
export const createDefaultHttpClient = (): HttpClient =>
  createHttpClient({
    fetch: (url, init) => fetch(url, init),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    random: Math.random,
    timeoutMs: HTTP_TIMEOUT_MS,
    retries: HTTP_RETRIES,
    userAgent: ROBOTS_USER_AGENT,
  });
