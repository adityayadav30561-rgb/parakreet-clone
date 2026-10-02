import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/out/**', '**/dist/**', '**/release/**', '**/node_modules/**', '**/*.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  { files: ['eslint.config.js'], ...tseslint.configs.disableTypeChecked },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'eslint.config.js',
            'apps/desktop/vitest.config.ts',
            'apps/desktop/playwright.config.ts',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['apps/desktop/renderer/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.browser } },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    files: ['apps/desktop/electron/**/*.ts', 'apps/desktop/preload/**/*.ts', 'packages/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
);
