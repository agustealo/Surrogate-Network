import tsPlugin from '@typescript-eslint/eslint-plugin';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@next': nextPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
];