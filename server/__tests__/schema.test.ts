import { PrismaClient } from '@prisma/client';
import { appendFilterConfig, getActiveFilterConfig } from '../src/services/filter-config.service';

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.posting.deleteMany();
  await prisma.source.deleteMany();
  await prisma.company.deleteMany();
  await prisma.filterConfig.deleteMany();
});
afterAll(async () => prisma.$disconnect());

const seedSource = async (): Promise<{ companyId: number; sourceId: number }> => {
  const company = await prisma.company.create({ data: { name: 'Acme', category: 'PRODUCT_SAAS_HOMEGROWN' } });
  const source = await prisma.source.create({
    data: { companyId: company.id, kind: 'GREENHOUSE', label: 'main', config: { boardToken: 'acme' } },
  });
  return { companyId: company.id, sourceId: source.id };
};

const posting = (companyId: number, sourceId: number, identityKey: string) => ({
  companyId,
  sourceId,
  identityKey,
  title: 't',
  url: 'https://acme.example/1',
  locationText: 'Chennai',
  descriptionHtml: '<p>d</p>',
  descriptionText: 'd',
});

describe('Posting', () => {
  it('is unique on (company, identity key)', async () => {
    const { companyId, sourceId } = await seedSource();
    await prisma.posting.create({ data: posting(companyId, sourceId, 'GREENHOUSE:1') });
    await expect(prisma.posting.create({ data: posting(companyId, sourceId, 'GREENHOUSE:1') })).rejects.toThrow();
  });

  it('defaults tracking status to UNSET', async () => {
    const { companyId, sourceId } = await seedSource();
    const created = await prisma.posting.create({ data: posting(companyId, sourceId, 'GREENHOUSE:2') });
    expect(created.trackingStatus).toBe('UNSET');
  });
});

describe('FilterConfig', () => {
  it('treats the newest appended row as active and keeps history', async () => {
    await appendFilterConfig(prisma, { keywords: ['react'], cities: ['Chennai'], minExperienceYears: 2 });
    await appendFilterConfig(prisma, { keywords: ['backend'], cities: ['Bangalore'], minExperienceYears: 3 });
    expect((await getActiveFilterConfig(prisma))?.keywords).toEqual(['backend']);
    expect(await prisma.filterConfig.count()).toBe(2);
  });

  it('returns null when no config exists', async () => {
    expect(await getActiveFilterConfig(prisma)).toBeNull();
  });
});

describe('Source', () => {
  it('has a unique label per company', async () => {
    const { companyId } = await seedSource();
    await expect(
      prisma.source.create({ data: { companyId, kind: 'LEVER', label: 'main', config: { company: 'acme' } } }),
    ).rejects.toThrow();
  });
});
