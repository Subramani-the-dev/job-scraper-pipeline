import { prisma } from '@/adapters/db/prisma.adapter';

export const countOpenPostings = async (): Promise<number> => prisma.posting.count({ where: { closedAt: null } });
