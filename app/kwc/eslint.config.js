export default [
  {
    files: ['**/*.tsx'],
    rules: {
      'no-restricted-globals': ['error', 'window']
    }
  }
]
