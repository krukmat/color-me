module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/__tests__/setup\\.ts$',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-image-picker)/)',
  ],
  moduleNameMapper: {
    '^react-native-image-picker$': '<rootDir>/__mocks__/react-native-image-picker.js',
    '^react-native-config$': '<rootDir>/__mocks__/react-native-config.js',
    '^react-native/Libraries/Linking/Linking$': '<rootDir>/__mocks__/Linking.js',
    '^react-native/Libraries/Share/Share$': '<rootDir>/__mocks__/Share.js',
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/types/**',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/config/env.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
