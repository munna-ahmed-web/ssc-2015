import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import pluginImport from "eslint-plugin-import";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ✅ This block enables type-aware linting
  {
    languageOptions: {
      parserOptions: {
        project: true, // auto-finds tsconfig.json
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // ─── Import hygiene ────────────────────────────────────────────────────────
  {
    plugins: {
      import: pluginImport,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "import/no-duplicates": "error",
      "import/no-cycle": ["error", { maxDepth: 3 }],
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling"],
          "newlines-between": "always",
        },
      ],
    },
  },

  // ─── Targeted TypeScript strictness (beyond preset defaults) ──────────────
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error", // No escape hatches
      "@typescript-eslint/consistent-type-imports": "error", // import type { Foo }
      "@typescript-eslint/no-floating-promises": "error", // Unhandled promises = bugs
      "@typescript-eslint/no-misused-promises": "error", // Promise in non-async ctx
      "@typescript-eslint/switch-exhaustiveness-check": "error", // Exhaustive switch on unions
      "@typescript-eslint/no-unnecessary-condition": "warn", // Dead branches
    },
  },

  // ─── General best practices ───────────────────────────────────────────────
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }], // Allow logging errors only
      "no-debugger": "error",
      "no-alert": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "warn",
      "no-nested-ternary": "warn", // Readability cliff
      eqeqeq: ["error", "always"], // No == type coercion bugs
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "eslint.config.mjs",
    "*.config.js",
    "*.config.ts",
    "**/*.generated.ts",
    "components/ui/**",
  ]),
  prettier, // ← Must be LAST. Disables all ESLint formatting rules.
]);

export default eslintConfig;
