/**
 * @8688bnb/config-eslint — Shared ESLint base config
 *
 * Apps can extend this in their eslint.config.mjs:
 *   import baseConfig from '@8688bnb/config-eslint';
 *   export default [...baseConfig, ...appSpecificRules];
 */

export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      ".next/",
      "out/",
    ],
  },
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
    },
  },
];
