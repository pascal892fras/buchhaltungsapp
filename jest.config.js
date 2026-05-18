module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  transformIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'src/modules/**/*.js',
    '!src/modules/__tests__/**',
    '!src/modules/**/index.js',
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  verbose: true,
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/modules/__tests__/**/*.test.js'],
    },
  ],
};

