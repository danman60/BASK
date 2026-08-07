// Shared flat ESLint config for the whole monorepo.
// Apps and packages do not carry their own config — ESLint resolves this one
// from any file in the tree, so `pnpm lint` at the root covers everything.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/generated/**',
      'mockups/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Node scripts: plain `.mjs` files get no TS lib, so `console` and
    // `process` are undeclared globals without this.
    files: ['**/*.mjs', '**/scripts/**/*.{ts,mjs}'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
  prettier,
);
