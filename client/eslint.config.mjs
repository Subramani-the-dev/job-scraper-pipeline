import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Mechanical house rules from ~/.claude/CLAUDE.md, enforced here instead of in review.
    files: ["**/*.{ts,tsx}"],
    rules: {
      // No `as SomeType` to silence the compiler (`as const` stays allowed).
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "no-restricted-syntax": [
        "error",
        {
          selector: ":function[async=true] CallExpression[callee.property.name=/^(then|catch)$/]",
          message: "Use await + try/catch inside async functions; don't mix in .then()/.catch().",
        },
        {
          selector: "CatchClause:not(:has(CallExpression[callee.object.name='logger']))",
          message: "Log the error with logger.* before returning a failure or re-throwing.",
        },
      ],
    },
  },
]);

export default eslintConfig;
