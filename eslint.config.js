// @ts-check
import js from '@eslint/js'              // Not installed separately — bundled via eslint
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import reactPlugin from 'eslint-plugin-react'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'coverage',
      'node_modules',
      'supabase/.temp',
      'supabase/functions/**',
      '*.config.js',
      '*.config.ts',
      'scripts/**/*.mjs',
    ],
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
  },

  // React rules
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off', // Not needed with React 18 JSX transform
      'react/prop-types': 'off',         // We use TypeScript for this

      // TypeScript strictness
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-non-null-assertion': 'error',

      // No console.log in production code (use the logger utility instead)
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // Route configuration exports router instances rather than React components.
  {
    files: ['src/router.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Disable formatting rules (Prettier handles those)
  eslintConfigPrettier,
)
