import { PrismaClient } from '@prisma/client';
import { resetDb } from './support/db.support';
import { runSource } from '../src/services/run-source.service';
import { HttpClient, HttpResponse } from '../src/interfaces/http.interface';
import normal from './fixtures/greenhouse/normal.json';
import empty from './fixtures/greenhouse/empty.json';
import malformed from './fixtures/greenhouse/malformed.json';
import blocked from './fixtures/greenhouse/blocked.json';

const prisma = new PrismaClient();

const fakeHttp = (respond: (url: string) => HttpResponse): HttpClient => ({
  get: async (url) => respond(url),
});
const json = (body: unknown): HttpResponse => ({ status: 200, body: JSON.stringify(body) });

beforeEach(async () => resetDb(prisma));
afterAll(async () => prisma.$disconnect());

const seedGreenhouse = async (): Promise<number> => {
  const company = await prisma.company.create({ data: { name: 'Sigmoid', category: 'SERVICES_CONSULTING' } });
  const source = await prisma.source.create({
    data: { companyId: company.id, kind: 'GREENHOUSE', label: 'greenhouse', config: { boardToken: 'sigmoid' } },
  });
  return source.id;
};

describe('runSource (Greenhouse)', () => {
  it('saves every posting and records an OK Run', async () => {
    const sourceId = await seedGreenhouse();
    await runSource(prisma, sourceId, { http: fakeHttp(() => json(normal)) });

    expect(await prisma.posting.count()).toBe(3);
    const posting = await prisma.posting.findFirstOrThrow({ where: { identityKey: 'GREENHOUSE:8742061002' } });
    expect(posting).toMatchObject({
      identityKey: 'GREENHOUSE:8742061002',
      externalId: '8742061002',
      title: 'Accounts Director',
      url: 'https://job-boards.greenhouse.io/sigmoid/jobs/8742061002',
      locationText: 'Atlanta , GA, USA',
      postedAt: new Date('2026-08-24T10:21:15Z'),
    });
    expect(posting.descriptionHtml).toContain('<h2>Accounts Director - Sigmoid Analytics</h2>');
    expect(posting.descriptionText).toContain('Accounts Director - Sigmoid Analytics');
    expect(posting.descriptionText).not.toContain('<');

    const run = await prisma.run.findFirstOrThrow({ where: { sourceId } });
    expect(run).toMatchObject({ status: 'OK', postingsCount: 3, newCount: 3, errorKind: null });
    expect(run.finishedAt).not.toBeNull();
  });

  it('records an OK Run with no postings for an empty board', async () => {
    const sourceId = await seedGreenhouse();
    await runSource(prisma, sourceId, { http: fakeHttp(() => json(empty)) });

    expect(await prisma.posting.count()).toBe(0);
    const run = await prisma.run.findFirstOrThrow({ where: { sourceId } });
    expect(run).toMatchObject({ status: 'OK', postingsCount: 0, newCount: 0 });
  });

  it('skips a malformed item, keeps the rest and records a PARTIAL Run with a warning', async () => {
    const sourceId = await seedGreenhouse();
    await runSource(prisma, sourceId, { http: fakeHttp(() => json(malformed)) });

    expect(await prisma.posting.count()).toBe(2);
    const run = await prisma.run.findFirstOrThrow({ where: { sourceId } });
    expect(run).toMatchObject({ status: 'PARTIAL', postingsCount: 2, newCount: 2 });
    expect(run.warnings).toEqual([expect.stringContaining('8742061002')]);
  });

  it('records a FAILED blocked Run and saves nothing when the board answers 403', async () => {
    const sourceId = await seedGreenhouse();
    await runSource(prisma, sourceId, { http: fakeHttp(() => blocked) });

    expect(await prisma.posting.count()).toBe(0);
    const run = await prisma.run.findFirstOrThrow({ where: { sourceId } });
    expect(run).toMatchObject({ status: 'FAILED', errorKind: 'blocked', postingsCount: 0 });
  });

  it('re-running updates content and lastSeenAt in place without duplicates', async () => {
    const sourceId = await seedGreenhouse();
    await runSource(prisma, sourceId, { http: fakeHttp(() => json(normal)) });
    const before = await prisma.posting.findFirstOrThrow({ where: { identityKey: 'GREENHOUSE:8742061002' } });

    const [first, ...rest] = normal.jobs;
    const edited = { jobs: [{ ...first, title: 'Accounts Director (Edited)' }, ...rest], meta: { total: 3 } };
    await runSource(prisma, sourceId, { http: fakeHttp(() => json(edited)) });

    expect(await prisma.posting.count()).toBe(3);
    const after = await prisma.posting.findFirstOrThrow({ where: { identityKey: 'GREENHOUSE:8742061002' } });
    expect(after.id).toBe(before.id);
    expect(after.title).toBe('Accounts Director (Edited)');
    expect(after.firstSeenAt).toEqual(before.firstSeenAt);
    expect(after.lastSeenAt.getTime()).toBeGreaterThan(before.lastSeenAt.getTime());

    const runs = await prisma.run.findMany({ where: { sourceId }, orderBy: { id: 'asc' } });
    expect(runs.map((r) => r.newCount)).toEqual([3, 0]);
  });

  it('records a FAILED malformed Run when the Source config is invalid for its kind', async () => {
    const sourceId = await seedGreenhouse();
    await prisma.source.update({ where: { id: sourceId }, data: { config: { board: 'sigmoid' } } });
    await runSource(prisma, sourceId, { http: fakeHttp(() => json(normal)) });

    const run = await prisma.run.findFirstOrThrow({ where: { sourceId } });
    expect(run).toMatchObject({ status: 'FAILED', errorKind: 'malformed', postingsCount: 0 });
  });

  it('records a FAILED unsupported Run for a Source kind with no Adapter yet', async () => {
    const sourceId = await seedGreenhouse();
    await prisma.source.update({ where: { id: sourceId }, data: { kind: 'KULA', config: { host: 'h', company: 'c' } } });
    await runSource(prisma, sourceId, { http: fakeHttp(() => json(normal)) });

    const run = await prisma.run.findFirstOrThrow({ where: { sourceId } });
    expect(run).toMatchObject({ status: 'FAILED', errorKind: 'unsupported' });
  });
});
