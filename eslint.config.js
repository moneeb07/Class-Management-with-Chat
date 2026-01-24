import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
  // ✅ Frontend / Client config
  {
    files: ["client/**/*.{js,mjs,cjs,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser, // allow browser globals (window, document, etc.)
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginReact.configs.flat.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,

      "no-undef": "error", // ✅ catch undefined vars like `isLoading`

      "no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // React specific rules
      "react/react-in-jsx-scope": "off", // Not needed in React 17+
      "react/prop-types": "warn",

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      "no-console": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // ✅ Backend / Server config
  {
    files: ["server/**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node, // allow Node.js globals (require, module, __dirname, etc.)
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      ...js.configs.recommended.rules,

      "no-undef": "error", // ✅ enforce undefined vars check
      "no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "no-console": "off",
    },
  },
]);
