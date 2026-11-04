import { Prisma, PrismaClient, RunStatus, Source, SourceKind } from '@prisma/client';
import pino from 'pino';
import { RUN_TRANSACTION_TIMEOUT_MS } from '../constants/app.constant';
import { greenhouseAdapter } from '../adapters/greenhouse/greenhouse.adapter';
import { buildIdentityKey } from '../helpers/posting-key.helper';
import { ScrapeError } from '../helpers/scrape-error.helper';
import { Adapter, AdapterContext, AdapterResult, ScrapedPosting } from '../interfaces/adapter.interface';

const logger = pino();

const ADAPTERS: Partial<Record<SourceKind, Adapter>> = {
  GREENHOUSE: greenhouseAdapter,
};

const RUN_STATUS: Record<AdapterResult['status'], RunStatus> = { ok: 'OK', partial: 'PARTIAL', failed: 'FAILED' };

const failed = (source: Source, err: ScrapeError): AdapterResult => {
  logger.warn({ sourceId: source.id, kind: err.kind, message: err.message }, 'Source failed');
  return { status: 'failed', reason: err.kind };
};

// A ScrapeError is the Source's fault and becomes a FAILED Run; anything else is infrastructure and propagates.
const fetchResult = async (source: Source, ctx: AdapterContext, knownKeys: ReadonlySet<string>): Promise<AdapterResult> => {
  const adapter = ADAPTERS[source.kind];
  if (!adapter) return failed(source, new ScrapeError('unsupported', `No adapter for ${source.kind}`));
  try {
    return await adapter.fetch(source, ctx, knownKeys);
  } catch (err) {
    if (!(err instanceof ScrapeError)) {
      logger.error({ err, sourceId: source.id }, 'Adapter crashed');
      throw err;
    }
    return failed(source, err);
  }
};

const postingsOf = (result: AdapterResult): ScrapedPosting[] => (result.status === 'failed' ? [] : result.postings);

const runFields = (result: AdapterResult): Pick<Prisma.RunUncheckedCreateInput, 'status' | 'errorKind' | 'warnings'> => ({
  status: RUN_STATUS[result.status],
  errorKind: result.status === 'failed' ? result.reason : null,
  warnings: result.status === 'partial' ? result.warnings : [],
});

export const runSource = async (prisma: PrismaClient, sourceId: number, ctx: AdapterContext): Promise<void> => {
  const startedAt = new Date();
  const source = await prisma.source.findUniqueOrThrow({ where: { id: sourceId } });
  const known = await prisma.posting.findMany({ where: { sourceId }, select: { identityKey: true } });
  const knownKeys = new Set(known.map((p) => p.identityKey));

  const result = await fetchResult(source, ctx, knownKeys);
  const postings = postingsOf(result);
  const keyed = postings.map((posting) => ({
    posting,
    identityKey: buildIdentityKey(source.kind, posting.externalId, posting.url),
  }));
  const newCount = keyed.filter(({ identityKey }) => !knownKeys.has(identityKey)).length;

  // Postings and their Run land together or not at all. Prisma has no bulk upsert, so the
  // upserts run one per posting inside the transaction (boards are tens of jobs).
  await prisma.$transaction(
    async (tx) => {
      const seenAt = new Date();
      for (const { posting, identityKey } of keyed) {
        await tx.posting.upsert({
          where: { companyId_identityKey: { companyId: source.companyId, identityKey } },
          create: { ...posting, identityKey, companyId: source.companyId, sourceId, firstSeenAt: seenAt, lastSeenAt: seenAt },
          update: { ...posting, lastSeenAt: seenAt },
        });
      }
      await tx.run.create({
        data: { sourceId, startedAt, finishedAt: new Date(), postingsCount: postings.length, newCount, ...runFields(result) },
      });
    },
    { timeout: RUN_TRANSACTION_TIMEOUT_MS },
  );
};
