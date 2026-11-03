import { PrismaClient } from '@prisma/client';

declare global {
  // Survives dev hot reloads so each reload doesn't open new Neon connections.
  var prismaClient: PrismaClient | undefined;
}

export const prisma: PrismaClient = globalThis.prismaClient ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prismaClient = prisma;
