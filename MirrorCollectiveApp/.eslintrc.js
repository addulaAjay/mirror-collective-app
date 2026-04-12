module.exports = {
  root: true,
  extends: '@react-native',
  plugins: ['import'],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  overrides: [
    {
      // Hex literals are allowed in the theme layer — that's where they're defined.
      files: ['src/theme/**/*.ts', 'src/theme/**/*.tsx'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
  ],
  rules: {
    // Block raw hex color literals outside the theme directory.
    // All colors must reference palette.* or theme.colors.* from '@theme'.
    'no-restricted-syntax': [
      'error',
      {
        selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
        message: "Avoid hardcoded hex colors. Use palette.* or theme.colors.* from '@theme' instead.",
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../../*'],
            message: 'Usage of deep relative imports is forbidden. Please use path aliases (e.g., @components, @utils).',
          },
        ],
      },
    ],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
        pathGroups: [
          {
            pattern: '@components/**',
            group: 'internal',
          },
          {
            pattern: '@screens/**',
            group: 'internal',
          },
          {
            pattern: '@utils/**',
            group: 'internal',
          },
          {
            pattern: '@services/**',
            group: 'internal',
          },
          {
            pattern: '@hooks/**',
            group: 'internal',
          },
          {
            pattern: '@context/**',
            group: 'internal',
          },
          {
            pattern: '@theme/**',
            group: 'internal',
          },
          {
            pattern: '@types/**',
            group: 'internal',
          },
          {
            pattern: '@assets/**',
            group: 'internal',
          },
          {
            pattern: '@constants/**',
            group: 'internal',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
      },
    ],
  },
};
