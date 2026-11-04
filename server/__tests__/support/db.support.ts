import { PrismaClient } from '@prisma/client';

// Children before parents, so foreign keys never block the wipe whichever suite ran last.
export const resetDb = async (prisma: PrismaClient): Promise<void> => {
  await prisma.alertPosting.deleteMany();
  await prisma.alertLog.deleteMany();
  await prisma.posting.deleteMany();
  await prisma.run.deleteMany();
  await prisma.source.deleteMany();
  await prisma.company.deleteMany();
  await prisma.filterConfig.deleteMany();
};
