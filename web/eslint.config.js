import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.strict],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='toFixed']",
          message: 'Use the money/date helpers in src/lib instead of toFixed.',
        },
        {
          selector: "CallExpression[callee.property.name='toISOString']",
          message: 'Use src/lib/dates for dates; toISOString() is UTC.',
        },
      ],
    },
  },
  {
    files: ['src/components/ui/**/*.tsx', 'src/app/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
