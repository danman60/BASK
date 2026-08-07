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
      // Agent worktrees are separate checkouts of this same repo — linting them
      // from the root double-reports every file and surfaces other lanes' WIP.
      '.claude/worktrees/**',
      'mockups/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Node scripts (.mjs tooling: migration guards, seeds, contrast gate) run outside
    // the browser — declare the Node globals so `console`/`process` aren't no-undef.
    files: ['**/*.mjs', '**/scripts/**/*.{js,ts}'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly', URL: 'readonly', fetch: 'readonly' },
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
