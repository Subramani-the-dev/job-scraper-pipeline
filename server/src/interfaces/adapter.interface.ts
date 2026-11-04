import { Source } from '@prisma/client';
import { HttpClient } from './http.interface';

export interface ScrapedPosting {
  externalId: string | null;
  title: string;
  url: string;
  locationText: string;
  postedAt: Date | null;
  descriptionHtml: string;
  descriptionText: string;
}

export type FailureReason = 'blocked' | 'network' | 'malformed' | 'unsupported';

export interface AdapterOk {
  status: 'ok';
  postings: ScrapedPosting[];
}

export interface AdapterPartial {
  status: 'partial';
  postings: ScrapedPosting[];
  warnings: string[];
}

export interface AdapterFailed {
  status: 'failed';
  reason: FailureReason;
}

export type AdapterResult = AdapterOk | AdapterPartial | AdapterFailed;

export interface AdapterContext {
  http: HttpClient;
}

// Stateless: everything a fetch needs arrives as arguments. `knownKeys` holds the identity
// keys already stored for this Source, so adapters with per-posting detail requests can skip them.
export interface Adapter {
  fetch: (source: Source, ctx: AdapterContext, knownKeys: ReadonlySet<string>) => Promise<AdapterResult>;
}
