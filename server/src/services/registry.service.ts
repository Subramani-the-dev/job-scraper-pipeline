import { PrismaClient } from '@prisma/client';
import { REMOVED_SOURCE_NOTE, ROBOTS_USER_AGENT, SYNC_TRANSACTION_TIMEOUT_MS } from '../constants/app.constant';
import { isPathAllowed } from '../helpers/robots.helper';
import { routeUrls, validateSourceConfig } from '../helpers/source-config.helper';
import { RegistryEntry } from '../interfaces/registry.interface';
import { RobotsFetcher, RobotsResponse } from '../interfaces/robots.interface';

const assertRoutesAllowed = async (
  entry: RegistryEntry,
  fetchRobots: RobotsFetcher,
  cache: Map<string, RobotsResponse>,
): Promise<void> => {
  for (const source of entry.sources) {
    for (const route of routeUrls(source.kind, source.config)) {
      const { origin, pathname } = new URL(route);
      let robots = cache.get(origin);
      if (!robots) {
        robots = await fetchRobots(origin);
        cache.set(origin, robots);
      }
      if (!isPathAllowed(robots, ROBOTS_USER_AGENT, pathname)) {
        throw new Error(`robots.txt disallows ${route} (${entry.name} / ${source.label})`);
      }
    }
  }
};

// Validates every entry first so a bad entry writes nothing, then upserts in one transaction.
export const syncRegistry = async (
  prisma: PrismaClient,
  entries: RegistryEntry[],
  fetchRobots: RobotsFetcher,
): Promise<void> => {
  const robotsCache = new Map<string, RobotsResponse>();
  for (const entry of entries) {
    for (const source of entry.sources) {
      validateSourceConfig(source.kind, source.config);
    }
    await assertRoutesAllowed(entry, fetchRobots, robotsCache);
  }

  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      const company = await tx.company.upsert({
        where: { name: entry.name },
        create: { name: entry.name, category: entry.category, careersUrl: entry.careersUrl },
        update: { category: entry.category, careersUrl: entry.careersUrl ?? null },
      });
      for (const source of entry.sources) {
        const { config } = source;
        await tx.source.upsert({
          where: { companyId_label: { companyId: company.id, label: source.label } },
          create: {
            companyId: company.id,
            kind: source.kind,
            label: source.label,
            config,
            note: source.note,
          },
          update: { kind: source.kind, config, enabled: true, note: source.note ?? null },
        });
      }
      await tx.source.updateMany({
        where: { companyId: company.id, label: { notIn: entry.sources.map((s) => s.label) }, enabled: true },
        data: { enabled: false, note: REMOVED_SOURCE_NOTE },
      });
    }
    await tx.source.updateMany({
      where: { company: { name: { notIn: entries.map((e) => e.name) } }, enabled: true },
      data: { enabled: false, note: REMOVED_SOURCE_NOTE },
    });
  }, { timeout: SYNC_TRANSACTION_TIMEOUT_MS });
};
