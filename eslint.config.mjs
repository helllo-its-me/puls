import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const nodeFiles = [
  '*.config.{js,mjs,cjs,ts}',
  'apps/api/**/*.{js,mjs,cjs,ts}',
  'apps/mobile/*.config.{js,mjs,cjs,ts}',
  'apps/mobile/scripts/**/*.{js,mjs,cjs,ts}',
  'packages/db/**/*.{js,mjs,cjs,ts}',
  'scripts/**/*.{js,mjs,cjs,ts}',
  'tests/**/*.{js,mjs,cjs,ts}'
];

export default defineConfig([
  {
    ignores: [
      '**/build/**',
      '**/coverage/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**'
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    settings: {
      'import/resolver': {
        typescript: {
          project: [
            './apps/*/tsconfig.json',
            './packages/*/tsconfig.json',
            './tsconfig.json',
            './tsconfig.migrations.json'
          ]
        }
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "TSAsExpression:not([typeAnnotation.type='TSTypeReference'][typeAnnotation.typeName.name='const'])",
          message: 'Type assertions are prohibited. Model and validate the value instead.'
        }
      ]
    }
  },
  {
    files: nodeFiles,
    languageOptions: {
      globals: globals.node
    },
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'document',
          message: 'DOM globals are unavailable in the Node.js runtime.'
        },
        {
          name: 'window',
          message: 'DOM globals are unavailable in the Node.js runtime.'
        }
      ]
    }
  },
  {
    files: ['apps/mobile/{app,src}/**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    extends: expoConfig
  }
]);
