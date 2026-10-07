// Aturan lint mengikuti fe-solutest (airbnb-style + perfectionist + unused-imports + prettier),
// disesuaikan ke ESLint flat config & eslint-config-next. Detail: docs/coding-rules.md
//
// 0 ~ 'off' · 1 ~ 'warn' · 2 ~ 'error'
import prettier from 'eslint-config-prettier/flat';
import nextTs from 'eslint-config-next/typescript';
import unusedImports from 'eslint-plugin-unused-imports';
import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const group = (groupName, pattern) => ({ groupName, elementNamePattern: pattern });

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    plugins: { perfectionist, 'unused-imports': unusedImports },
    rules: {
      // general
      'no-alert': 0,
      camelcase: 0,
      'no-console': [1, { allow: ['warn', 'error', 'info'] }],
      'no-unused-vars': 0,
      'no-nested-ternary': 0,
      'no-param-reassign': 0,
      'no-underscore-dangle': 0,
      'prefer-destructuring': [1, { object: true, array: false }],
      'object-shorthand': 1,
      'prefer-template': 1,
      eqeqeq: [2, 'smart'],
      // typescript
      '@typescript-eslint/no-explicit-any': 1,
      '@typescript-eslint/no-use-before-define': 0,
      '@typescript-eslint/consistent-type-exports': 0,
      '@typescript-eslint/consistent-type-imports': 1,
      '@typescript-eslint/no-unused-vars': [1, { args: 'none', varsIgnorePattern: '^_' }],
      // react
      'react/no-children-prop': 0,
      'react/react-in-jsx-scope': 0,
      'react/no-array-index-key': 0,
      'react/require-default-props': 0,
      'react/jsx-props-no-spreading': 0,
      'react/function-component-definition': 0,
      'react/jsx-no-duplicate-props': [1, { ignoreCase: false }],
      'react/jsx-no-useless-fragment': [1, { allowExpressions: true }],
      'react/no-unstable-nested-components': [1, { allowAsProps: true }],
      // jsx-a11y
      'jsx-a11y/anchor-is-valid': 0,
      'jsx-a11y/control-has-associated-label': 0,
      // unused imports
      'unused-imports/no-unused-imports': 1,
      // perfectionist — urutan import per kelompok, diurutkan berdasarkan panjang baris
      'perfectionist/sort-exports': [1, { order: 'asc', type: 'line-length' }],
      'perfectionist/sort-named-imports': [1, { order: 'asc', type: 'line-length' }],
      'perfectionist/sort-named-exports': [1, { order: 'asc', type: 'line-length' }],
      'perfectionist/sort-imports': [
        1,
        {
          order: 'asc',
          type: 'line-length',
          newlinesBetween: 1,
          internalPattern: ['^src/.+'],
          groups: [
            'side-effect-style',
            'style',
            'type-import',
            ['value-builtin', 'value-external'],
            'custom-ui',
            'custom-config',
            'custom-core',
            'custom-hooks',
            'custom-utils',
            'custom-state',
            'value-internal',
            'custom-components',
            'custom-sections',
            'custom-mocks',
            ['value-parent', 'value-sibling', 'value-index'],
            'unknown',
          ],
          customGroups: [
            group('custom-ui', '^src/components/ui/.+'),
            group('custom-config', '^src/config/.+'),
            group('custom-core', '^src/core/.+'),
            group('custom-hooks', '^src/hooks/.+'),
            group('custom-utils', '^src/(utils|lib)/.+'),
            group('custom-state', '^src/state/.+'),
            group('custom-components', '^src/components/.+'),
            group('custom-sections', '^src/sections/.+'),
            group('custom-mocks', '^src/mocks/.+'),
          ],
        },
      ],
    },
  },
  {
    // Komponen shadcn/ui dibiarkan sesuai upstream agar mudah di-update lewat `npx shadcn add`.
    files: ['src/components/ui/**'],
    rules: {
      'perfectionist/sort-imports': 0,
      'perfectionist/sort-named-imports': 0,
      'perfectionist/sort-named-exports': 0,
      'perfectionist/sort-exports': 0,
      eqeqeq: 0,
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**']),
]);
