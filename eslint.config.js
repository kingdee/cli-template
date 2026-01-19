import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import vueParser from 'vue-eslint-parser';

export default [
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/temp-entry/**',
      '**/package-lock.json',
      '**/*.log',
      '**/.vscode/**',
      '**/.idea/**',
      '**/.DS_Store'
    ]
  },

  // Base JS config
  js.configs.recommended,

  // Base Vue config
  ...pluginVue.configs['flat/recommended'],

  // Custom rules and language options
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      },
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue']
      }
    },
    rules: {
      // General rules
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2, { 'SwitchCase': 1 }],
      'no-multi-spaces': 'error',
      'space-unary-ops': ['error', { 'words': true, 'nonwords': false }],
      'space-before-blocks': ['error', 'always'],
      'no-mixed-spaces-and-tabs': 'error',
      'no-multiple-empty-lines': ['error', { 'max': 1 }],
      'no-trailing-spaces': 'error',
      'no-whitespace-before-property': 'error',
      'no-irregular-whitespace': 'error',
      'space-in-parens': ['warn', 'never'],
      'comma-dangle': ['warn', 'never'],
      'max-len': ['error', { 'code': 200 }],
      'operator-linebreak': ['error', 'before'],
      'comma-style': ['error', 'last'],
      'no-extra-semi': 'error',
      'curly': ['error', 'all'],
      'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
      'comma-spacing': ['warn', { 'before': false, 'after': true }],
      'spaced-comment': ['warn', 'always'],
      'eqeqeq': ['error', 'always', { 'null': 'ignore' }],
      'no-else-return': ['warn', { 'allowElseIf': false }],
      'no-loop-func': 'error',
      'no-implicit-coercion': ['warn', { 'allow': ['!!'] }],
      'max-params': ['warn', 6],
      'no-eval': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-destructuring': ['warn', { 'object': true, 'array': false }],
      'prefer-template': 'warn',
      'no-duplicate-imports': 'error',
      'radix': 'warn',
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],

      // Vue rules
      'vue/multi-word-component-names': 'off',
      'vue/html-indent': ['error', 2],
      'vue/max-attributes-per-line': ['warn', {
        'singleline': { 'max': 3 },
        'multiline': { 'max': 1 }
      }]
    }
  }
];
