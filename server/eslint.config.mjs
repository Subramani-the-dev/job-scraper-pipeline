import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**', 'prisma/migrations/**']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // `_`-prefixed params are required-but-unused (e.g. Express's 4-arg error handler).
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'writable', require: 'readonly', process: 'readonly', URL: 'readonly' },
    },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]);
