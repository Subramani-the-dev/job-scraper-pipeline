import { FilterConfig, PrismaClient } from '@prisma/client';
import { NewFilterConfig } from '../interfaces/filter-config.interface';

export const appendFilterConfig = (prisma: PrismaClient, data: NewFilterConfig): Promise<FilterConfig> =>
  prisma.filterConfig.create({ data });

export const getActiveFilterConfig = (prisma: PrismaClient): Promise<FilterConfig | null> =>
  prisma.filterConfig.findFirst({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
