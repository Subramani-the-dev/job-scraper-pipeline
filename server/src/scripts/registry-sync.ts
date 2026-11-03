import 'dotenv/config';
import pino from 'pino';
import { REGISTRY } from '../config/registry.config';
import { ROBOTS_USER_AGENT } from '../constants/app.constant';
import { RobotsFetcher } from '../interfaces/robots.interface';
import prisma from '../lib/prisma';
import { syncRegistry } from '../services/registry.service';

const logger = pino();

const fetchRobots: RobotsFetcher = async (origin) => {
  const res = await fetch(`${origin}/robots.txt`, {
    headers: { 'User-Agent': ROBOTS_USER_AGENT },
    redirect: 'manual',
    signal: AbortSignal.timeout(15_000),
  });
  return { status: res.status, body: res.status === 200 ? await res.text() : '' };
};

const main = async (): Promise<void> => {
  await syncRegistry(prisma, REGISTRY, fetchRobots);
  logger.info({ companies: REGISTRY.length }, 'Registry synced');
};

main()
  .catch((err: unknown) => {
    logger.error({ err }, 'Registry sync failed');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
