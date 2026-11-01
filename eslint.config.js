import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import oxlint from 'eslint-plugin-oxlint'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue,ts}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    name: 'app/typescript',
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
    },
  },
  {
    name: 'app/vue-typescript',
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        sourceType: 'module',
      },
    },
  },
  oxlint.configs['flat/recommended'],
  skipFormatting,
  {
    name: 'app/disable-multi-word',
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    name: 'app/tailwind',
    files: ['**/tailwind.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
  },
  {
    name: 'app/node-files',
    files: ['cam-sync/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
  },
]
