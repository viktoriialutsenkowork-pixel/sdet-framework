// @ts-check
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default defineConfig([
  globalIgnores([
    'node_modules/',
    'playwright-report/',
    'test-results/',
    'scratch/',
    'eslint.config.mjs',
  ]),
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    files: ['tests/**'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      'playwright/expect-expect': [
        'error',
        {
          assertFunctionPatterns: ['^assert.*', '^verify.*', '^expect.*'],
        },
      ],
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-page-pause': 'error',
    },
  },
]);
