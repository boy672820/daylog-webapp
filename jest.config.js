/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  rootDir: __dirname,
  collectCoverageFrom: [
    'amplify/functions/**/*.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/dist/**',
    '!**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  // 테스트 환경 설정
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  // 테스트 타임아웃 설정 (밀리초)
  testTimeout: 10000,

  // 환경 설정 파일
  setupFiles: ['<rootDir>/tests/setup-env.ts'],

  // 테스트 실행 전후 설정
  setupFilesAfterEnv: [],

  // 테스트 디렉토리 구조
  roots: ['<rootDir>/tests'],

  // 테스트 실행 시 환경 변수 설정
  testEnvironmentOptions: {
    // 필요한 경우 여기에 추가 환경 변수 설정
  },

  // 유닛 테스트와 통합 테스트를 구분하기 위한 프로젝트 설정
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/units/**/*.spec.ts'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/tests/setup-env.ts'],
      testEnvironmentOptions: {
        TEST_TYPE: 'unit',
      },
      transform: {
        '^.+\\.ts?$': ['ts-jest', {
          tsconfig: '<rootDir>/amplify/tsconfig.json',
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^\\$amplify/(.*)$': '<rootDir>/.amplify/generated/$1',
      },
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integrations/**/*.spec.ts'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/tests/setup-env.ts'],
      testEnvironmentOptions: {
        TEST_TYPE: 'integration',
      },
      // 통합 테스트는 더 긴 타임아웃 설정
      testTimeout: 30000,
      transform: {
        '^.+\\.ts?$': ['ts-jest', {
          tsconfig: '<rootDir>/amplify/tsconfig.json',
          useESM: true,
        }]
      },
      extensionsToTreatAsEsm: [".ts"],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^\\$amplify/(.*)$': '<rootDir>/.amplify/generated/$1',
      },
    },
  ],
};

module.exports = config;