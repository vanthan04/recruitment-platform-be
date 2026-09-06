// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    // `expect(someMock.method).toHaveBeenCalledWith(...)` passes a mock's
    // method as a bare reference — always a jest.fn(), never `this`-bound —
    // which unbound-method can't tell apart from a real unbound-method bug.
    //
    // `mockImplementation(async (x) => x)` has to stay `async` to match the
    // mocked repository method's `Promise<T>`-returning signature, even when
    // the fake body never actually awaits anything.
    //
    // The no-unsafe-* family flags two things that are standard practice in
    // this test suite, not bugs: partial fixture objects deliberately cast
    // `as any` instead of constructing a full valid domain entity/DTO for
    // every test, and supertest's `response.body`, which is untyped `any`
    // by design (no per-request generic). Production code under src/ (minus
    // *.spec.ts) keeps full no-unsafe-* enforcement.
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
);
