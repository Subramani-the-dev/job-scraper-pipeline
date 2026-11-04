import { PrismaClient } from '@prisma/client';
import { resetDb } from '../support/db.support';
import { syncRegistry } from '../../src/services/registry.service';
import { RegistryEntry } from '../../src/interfaces/registry.interface';

const prisma = new PrismaClient();
const allowAll = async (): Promise<{ status: number; body: string }> => ({ status: 404, body: '' });
const denyAll = async (): Promise<{ status: number; body: string }> => ({
  status: 200,
  body: 'User-agent: *\nDisallow: /',
});

const entry: RegistryEntry = {
  name: 'Acme',
  category: 'PRODUCT_SAAS_HOMEGROWN',
  careersUrl: 'https://acme.example/careers',
  sources: [{ kind: 'GREENHOUSE', label: 'main', config: { boardToken: 'acme' } }],
};

beforeEach(async () => resetDb(prisma));
afterAll(async () => prisma.$disconnect());

describe('syncRegistry', () => {
  it('upserts one Company with one Source end to end', async () => {
    await syncRegistry(prisma, [entry], allowAll);
    const company = await prisma.company.findUniqueOrThrow({ where: { name: 'Acme' }, include: { sources: true } });
    expect(company.sources).toHaveLength(1);
    expect(company.sources[0]?.kind).toBe('GREENHOUSE');
    expect(company.sources[0]?.enabled).toBe(true);
  });

  it('is idempotent', async () => {
    await syncRegistry(prisma, [entry], allowAll);
    await syncRegistry(prisma, [entry], allowAll);
    expect(await prisma.company.count()).toBe(1);
    expect(await prisma.source.count()).toBe(1);
  });

  it('updates a Source config in place', async () => {
    await syncRegistry(prisma, [entry], allowAll);
    const changed = { ...entry, sources: [{ kind: 'GREENHOUSE' as const, label: 'main', config: { boardToken: 'acme2' } }] };
    await syncRegistry(prisma, [changed], allowAll);
    expect((await prisma.source.findFirstOrThrow()).config).toEqual({ boardToken: 'acme2' });
  });

  it('disables a removed Source with a note instead of deleting it', async () => {
    await syncRegistry(prisma, [entry], allowAll);
    await syncRegistry(prisma, [{ ...entry, sources: [] }], allowAll);
    const source = await prisma.source.findFirstOrThrow();
    expect(source.enabled).toBe(false);
    expect(source.note).toMatch(/removed/i);
  });

  it('refuses to seed a Source whose route robots.txt disallows', async () => {
    await expect(syncRegistry(prisma, [entry], denyAll)).rejects.toThrow(/robots/i);
    expect(await prisma.source.count()).toBe(0);
  });

  it('refuses a Source with an invalid config for its kind', async () => {
    const bad = { ...entry, sources: [{ kind: 'WORKDAY' as const, label: 'main', config: { host: 'h' } }] };
    await expect(syncRegistry(prisma, [bad], allowAll)).rejects.toThrow(/tenant/);
  });
});

describe('syncRegistry removed companies', () => {
  it('disables Sources of a company no longer in the registry', async () => {
    await syncRegistry(prisma, [entry], allowAll);
    await syncRegistry(prisma, [], allowAll);
    expect((await prisma.source.findFirstOrThrow()).enabled).toBe(false);
  });
});
