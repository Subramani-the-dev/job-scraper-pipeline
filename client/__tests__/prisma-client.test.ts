// @vitest-environment node
import { Prisma } from '@prisma/client';

// Guards the cross-package generate: if `npm run prisma:generate` didn't write the
// client into client/node_modules, tsc still passes against @prisma/client's empty stub.
describe('generated Prisma client', () => {
  it('is generated from the server schema', () => {
    expect(Prisma.ModelName).toHaveProperty('Posting');
  });
});
