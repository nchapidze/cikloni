// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  // The two apps share code only through the shared library (CLAUDE.md).
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: '@cikloni/shared/admin', message: 'Admin-only code; not for the shop.' }],
          patterns: [
            { group: ['**/projects/**'], message: 'Import shared code from @cikloni/shared.' },
          ],
        },
      ],
    },
  },
  {
    files: ['projects/admin/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/src/app/**', '**/shared/src/**'],
              message: 'Import from @cikloni/shared.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['projects/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/src/app/**', '**/admin/src/**'],
              message: 'Shared must not import from an app.',
            },
          ],
        },
      ],
    },
  },
]);
