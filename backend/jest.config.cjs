module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test/jest'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 30000
};
