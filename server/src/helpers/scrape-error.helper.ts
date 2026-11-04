import { FailureReason } from '../interfaces/adapter.interface';
import { HttpResponse } from '../interfaces/http.interface';

// A failure the Run records as `failed: <kind>` rather than an infrastructure crash.
export class ScrapeError extends Error {
  constructor(
    readonly kind: FailureReason,
    message: string,
  ) {
    super(message);
    this.name = 'ScrapeError';
  }
}

const BLOCKED_STATUSES = new Set([401, 403, 429]);

export const assertOk = (res: HttpResponse, url: string): HttpResponse => {
  if (BLOCKED_STATUSES.has(res.status)) throw new ScrapeError('blocked', `HTTP ${res.status} from ${url}`);
  if (res.status < 200 || res.status >= 300) throw new ScrapeError('network', `HTTP ${res.status} from ${url}`);
  return res;
};
