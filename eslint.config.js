// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintPluginNoOnlyTests from "eslint-plugin-no-only-tests";
import eslintPluginDeprecation from "eslint-plugin-deprecation";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginReactRecommended from "eslint-plugin-react/configs/recommended.js";

export default tseslint.config(
  /**
   * Recommended eslint rules
   */
  eslint.configs.recommended,
  /**
   * React Plugin
   */
  {
    /*     plugins: {
      react: react,
    }, */
    ...eslintPluginReactRecommended,
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/jsx-no-target-blank": "error",
      "react/jsx-key": "error",
      "react/no-direct-mutation-state": "error",
      // Disable react/jsx-uses-react and react/react-in-jsx-scope because they are no longer relevant with the new JSX transform
      // See https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
  /**
   * Recommended + Recommended Type Checked typescript-eslint rules
   */
  ...tseslint.configs.recommendedTypeChecked,
  /**
   * General rules
   */
  {
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
      "no-cond-assign": "error",
      "capitalized-comments": [
        "error",
        "always",
        {
          ignoreInlineComments: true,
          ignoreConsecutiveComments: true,
        },
      ],
      "spaced-comment": "error",
      "no-eval": "error",
      "no-trailing-spaces": "error",
      "no-unsafe-finally": "error",
      "no-var": "error",
      "default-param-last": "off",
      eqeqeq: [
        "error",
        "always",
        {
          null: "ignore",
        },
      ],
      "id-blacklist": "error",
      "no-underscore-dangle": "error",
      "require-atomic-updates": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "",
        },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/prefer-namespace-keyword": "error",
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
      "@typescript-eslint/no-use-before-define": [
        "error",
        {
          functions: false,
          classes: false,
          variables: true,
        },
      ],
      // Disabled for now to simplify migration to eslint
      "@typescript-eslint/no-var-requires": "warn",
      // Disabled checksVoidReturn for now to simplify migration to eslint
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false,
        },
      ],
      // Disabled for now to simplify migration to eslint
      "@typescript-eslint/unbound-method": "warn",
      // Disabled for now to simplify migration to eslint
      "@typescript-eslint/no-empty-interface": "warn",
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
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-useless-empty-export": "error",
      "@typescript-eslint/default-param-last": "error",
    },
  },
  /**
   * Test specific rules
   */
  {
    files: ["**/*.test.ts*"],
    rules: {
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
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
   * Deprecation Plugin
   */
  {
    plugins: {
      deprecation: eslintPluginDeprecation,
    },
    rules: {
      "deprecation/deprecation": "warn",
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
  // Add prettier as last entry to ensure it can overwrite other configurations
  {
    ...eslintPluginPrettier,
  },
);
