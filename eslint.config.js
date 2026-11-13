// @ts-check

import { fileURLToPath } from "node:url";
import eslint from "@eslint/js";
import eslintPluginOxlint from "eslint-plugin-oxlint";
import eslintPluginSecurity from "eslint-plugin-security";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintPluginNoOnlyTests from "eslint-plugin-no-only-tests";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  /**
   * Recommended eslint rules
   */
  eslint.configs.recommended,
  /**
   * Recommended + Recommended Type Checked typescript-eslint rules
   */
  ...tseslint.configs.recommendedTypeChecked,
  /**
   * General rules
   */
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./*/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "linebreak-style": ["error", "unix"],
      "spaced-comment": "error",
      "no-trailing-spaces": "error",
      "id-blacklist": "error",
      "require-atomic-updates": "off",
      semi: "off",
      "@typescript-eslint/semi": ["error", "always"],
      "@typescript-eslint/type-annotation-spacing": ["error"],
      camelcase: "off",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "import",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
        {
          selector: "default",
          format: ["camelCase"],
        },
        {
          selector: "interface",
          format: ["PascalCase"],
          custom: {
            regex: "^I[A-Z]",
            match: true,
          },
        },
        {
          selector: "enumMember",
          format: ["PascalCase", "UPPER_CASE"],
        },
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "forbid",
        },
        {
          selector: "property",
          format: ["PascalCase", "camelCase", "UPPER_CASE"],
          leadingUnderscore: "forbid",
        },
        {
          selector: "property",
          format: null,
          leadingUnderscore: "forbid",
          modifiers: ["requiresQuotes"],
        },
        {
          selector: "memberLike",
          modifiers: ["private"],
          format: ["PascalCase", "camelCase"],
          leadingUnderscore: "forbid",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
      ],
      // Disabled for now to simplify migration to eslint
      "@typescript-eslint/unbound-method": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      // Deactivated for now since we use {} a lot as return types
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/explicit-function-return-type": [
        "off",
        {
          allowExpressions: true,
        },
      ],
      "@typescript-eslint/no-base-to-string": "warn",
      "@typescript-eslint/no-deprecated": "warn",
    },
  },
  /**
   * Test specific rules
   */
  {
    files: ["**/*.test.ts*", "**/*.roxtest.ts*"],
    rules: {
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
    },
  },
  /**
   * No Only Tests Plugin
   */
  {
    plugins: {
      "no-only-tests": eslintPluginNoOnlyTests,
    },
    rules: {
      "no-only-tests/no-only-tests": "error",
    },
  },
  /**
   * Ignores
   */
  {
    ignores: [
      // Eslint config
      "eslint.config.js",
      // dist directories
      "*/dist/",
      // disttest directories
      "*/disttests/",
    ],
  },
  // Security findings are warnings; the existing lint errors remain blocking.
  eslintPluginSecurity.configs.recommended,
  // Keep Prettier after the lint rules so formatting settings take precedence.
  {
    ...eslintPluginPrettier,
  },
  // Disable the checks already handled by the shared Oxlint configuration.
  ...eslintPluginOxlint.buildFromOxlintConfigFile(fileURLToPath(new URL("./.oxlintrc.json", import.meta.url))),
);
