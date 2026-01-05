module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/src/__tests__/jest.setup.js'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__tests__/fileMock.js',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types$': '<rootDir>/src/types',
    '^@theme$': '<rootDir>/src/theme',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@i18n$': '<rootDir>/src/i18n',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|@react-navigation|@testing-library)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/src/__tests__/setup.ts',
    '<rootDir>/src/__tests__/jest.setup.js',
    '<rootDir>/src/__tests__/fileMock.js',
    '<rootDir>/src/__tests__/utils/',
  ],
};
