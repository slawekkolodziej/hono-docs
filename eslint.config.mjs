import js from '@eslint/js'
import globals from 'globals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import tsdocPlugin from 'eslint-plugin-tsdoc'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: ['dist/**', 'output/**', 'tsdown.config.ts', 'examples/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      tsdoc: tsdocPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@typescript-eslint/no-require-imports': 'off',
      'tsdoc/syntax': 'warn',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
])
