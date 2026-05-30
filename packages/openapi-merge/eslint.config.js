import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.js',
      'test',
      'vitest.config.ts',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      'object-shorthand': 'error',
      'quote-props': ['error', 'as-needed'],
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['warn', 'as-needed'],
      'no-duplicate-imports': 'error',
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
];
