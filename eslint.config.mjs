import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      'spaced-comment': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/prefer-ts-expect-error': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
    },
  },
  // {
  //   parserOptions: {
  //     ecmaVersion: 'latest',
  //   },
  // },
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/out/**', '**.n.**'],
  },
];
