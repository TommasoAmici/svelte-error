import { nodeResolve } from "@rollup/plugin-node-resolve";
import svelte from "rollup-plugin-svelte";
const svelteConfig = require("./svelte.config.js");

/**
 * @type {import('rollup').RollupOptions}
 */
const base = {
  input: "./index.js",
  plugins: [svelte(svelteConfig), nodeResolve({ browser: true })],
};

/**
 * @type {import('rollup').RollupOptions}
 */
const config = [
  // for use with a bundler
  {
    ...base,
    output: [
      {
        format: "esm",
        dir: "esm",
        preserveModules: true,
        preferConst: true,
        generatedCode: "es2015",
      },
      {
        format: "cjs",
        dir: "dist",
        preserveModules: true,
        preferConst: true,
        generatedCode: "es2015",
        exports: "auto",
      },
    ],
  },
];

export default config;
