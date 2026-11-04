/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  roots: ['<rootDir>/__tests__'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/support/', '/__tests__/fixtures/'],
  // Suites share one real test database, so they must never run in parallel —
  // set here (not as a CLI flag) so `npx jest` and `npm test` behave the same.
  maxWorkers: 1,
};
