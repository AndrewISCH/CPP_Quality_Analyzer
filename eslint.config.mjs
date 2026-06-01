import typescriptEslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '.vscode-test.mjs',
      '.vscode-test/',
      'eslint.config.mjs',
      'eslint.config.mts',
      'dist/',
    ],
  },
  {
    files: ['**/*.ts', '**/*.mjs', '**/*.mts'],
  },
  {
    plugins: {
      '@typescript-eslint': typescriptEslint.plugin,
    },

    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },

    rules: {
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
      ],

      // unused variables / imports
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // code smells
      'no-console': 'warn', // leftover debug logs
      'no-debugger': 'error', // debugger statements
      'no-duplicate-imports': 'error', // redundant import lines
      'no-shadow': 'off', // disabled in favour of TS version
      '@typescript-eslint/no-shadow': 'error', // variable shadowing
      '@typescript-eslint/no-explicit-any': 'error', // ban 'any' type
      '@typescript-eslint/no-floating-promises': 'error', // unawaited promises
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      'prefer-const': 'error', // use const when never reassigned
      'no-var': 'error', // ban var
      'object-shorthand': 'error', // { x: x } → { x }
      'no-else-return': 'error', // unnecessary else after return
      'no-lonely-if': 'error', // else { if } → else if
      eqeqeq: 'error', // === instead of ==
      curly: 'error', // always use braces
      'no-throw-literal': 'error', // throw Error objects, not literals
      semi: 'error', // require semicolons
    },
  },
];
