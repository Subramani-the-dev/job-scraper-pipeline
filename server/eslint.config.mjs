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
    // Mechanical house rules from ~/.claude/CLAUDE.md, enforced here instead of in review.
    files: ['**/*.ts'],
    rules: {
      // No `as SomeType` to silence the compiler (`as const` stays allowed).
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: ':function[async=true] CallExpression[callee.property.name=/^(then|catch)$/]',
          message: "Use await + try/catch inside async functions; don't mix in .then()/.catch().",
        },
        {
          selector: "CatchClause:not(:has(CallExpression[callee.object.name='logger']))",
          message: 'Log the error with logger.* before returning a failure or re-throwing.',
        },
      ],
    },
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
