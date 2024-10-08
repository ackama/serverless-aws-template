import { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test/setupExpectEachTestHasAssertions.ts'],
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'jsx', 'node'],
  transform: {
    '\\.tsx?': [
      'ts-jest',
      {
        // disable type checking when running tests, speeding them up and making
        // the development experience nicer by not blocking tests on types
        isolatedModules: true
      }
    ]
  }
};

export default config;
