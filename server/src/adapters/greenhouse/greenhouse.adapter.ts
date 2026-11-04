import pino from 'pino';
import { z } from 'zod';
import { GREENHOUSE_BOARDS_API } from '../../constants/app.constant';
import { assertOk, ScrapeError } from '../../helpers/scrape-error.helper';
import { greenhouseConfigSchema } from '../../helpers/source-config.helper';
import { Adapter, ScrapedPosting } from '../../interfaces/adapter.interface';
import { decodeHtmlEntities, formatZodIssues, htmlToText } from '../../utils/functions.utils';

const logger = pino();

const jobSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  absolute_url: z.url(),
  location: z.object({ name: z.string() }),
  first_published: z.string().nullish(),
  content: z.string(),
});

const boardSchema = z.object({ jobs: z.array(z.unknown()) });

const parseBoard = (body: string): z.infer<typeof boardSchema> => {
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch (err) {
    logger.warn({ err }, 'Greenhouse board is not JSON');
    throw new ScrapeError('malformed', 'Greenhouse board is not JSON');
  }
  const board = boardSchema.safeParse(raw);
  if (!board.success) throw new ScrapeError('malformed', `Greenhouse board: ${formatZodIssues(board.error)}`);
  return board.data;
};

const describeItem = (item: unknown): string => {
  const id = z.object({ id: z.union([z.number(), z.string()]) }).safeParse(item);
  return id.success ? String(id.data.id) : '(no id)';
};

const toPosting = (job: z.infer<typeof jobSchema>): ScrapedPosting => {
  // Greenhouse returns `content` with its HTML entity-escaped.
  const descriptionHtml = decodeHtmlEntities(job.content);
  return {
    externalId: String(job.id),
    title: job.title,
    url: job.absolute_url,
    locationText: job.location.name,
    postedAt: job.first_published ? new Date(job.first_published) : null,
    descriptionHtml,
    descriptionText: htmlToText(descriptionHtml),
  };
};

export const greenhouseAdapter: Adapter = {
  fetch: async (source, { http }) => {
    const config = greenhouseConfigSchema.safeParse(source.config);
    if (!config.success) throw new ScrapeError('malformed', `Greenhouse config: ${formatZodIssues(config.error)}`);
    const url = `${GREENHOUSE_BOARDS_API}/${config.data.boardToken}/jobs?content=true`;
    const board = parseBoard(assertOk(await http.get(url), url).body);
    const postings: ScrapedPosting[] = [];
    const warnings: string[] = [];
    for (const item of board.jobs) {
      const job = jobSchema.safeParse(item);
      if (job.success) postings.push(toPosting(job.data));
      else warnings.push(`Skipped job ${describeItem(item)}: ${formatZodIssues(job.error)}`);
    }
    return warnings.length > 0 ? { status: 'partial', postings, warnings } : { status: 'ok', postings };
  },
};
