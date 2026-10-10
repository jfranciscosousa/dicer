import { build } from "esbuild";
import { builtinModules } from "node:module";

await build({
  entryPoints: ["src/prod.tsx"],
  outfile: "dist/_worker.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  external: [...builtinModules, "node:*", "cloudflare:*"],
  target: "es2022",
});
