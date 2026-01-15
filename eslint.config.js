import js from '@eslint/js'
import react from 'eslint-plugin-react'
import typescriptParser from '@typescript-eslint/parser'
import typescriptEslint from '@typescript-eslint/eslint-plugin'

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        __dirname: 'readonly',
        process: 'readonly'
      },
    },
    plugins: {
      react,
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      ...typescriptEslint.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.jsx'],
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
      },
    },
    plugins: { react },
    rules: {
      'react/react-in-jsx-scope': 'off'
    }
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
      },
    },
  },
]
