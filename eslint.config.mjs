import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: true
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ),
  {
    rules: {
      // Error Prevention
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Security
      "no-eval": "error",
      "no-implied-eval": "error",

      // Best Practices
      "prefer-const": "warn",
      "no-var": "error",
      "eqeqeq": ["error", "always"],

      // React Specific
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Formatting
      "semi": ["error", "always"],
      "quotes": ["warn", "double"],
      "no-multiple-empty-lines": ["warn", { "max": 1 }],
    },
  },
];
export default eslintConfig;
