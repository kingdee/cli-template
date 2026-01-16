import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: ['dist/**', 'node_modules/**', 'temp-entry/**']
  },
  
  // JavaScript recommended rules
  js.configs.recommended,

  // Vue 3 recommended rules
  ...pluginVue.configs['flat/essential'],
  
  // Custom configuration
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'vue/multi-word-component-names': 'off', // Disable for web components which might be single word or specific naming
    }
  }
];
