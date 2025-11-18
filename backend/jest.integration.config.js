module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/integration/**/*.test.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  // DO NOT use setup file - integration tests need real Firebase
  // setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 120000, // 120 seconds for integration tests (cleanup can take time)
  clearMocks: false, // Don't clear mocks - we're using real services
  resetMocks: false,
  restoreMocks: false,
};
