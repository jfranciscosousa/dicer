# Dicer

Discord dice bot on Cloudflare Workers with slash commands, saved macros, and roll statistics. Hono handles signed `POST /bot` interactions. Macros use Cloudflare D1 through the `DB` binding. Local development uses Vite with `@cloudflare/vite-plugin` in the Workers runtime. `pnpm run dev:socket` receives Discord interactions over WebSocket in Node and uses Wrangler's local D1 platform proxy with the same command handlers.

## Conventions

- Use Workers APIs for production and Node 24 LTS for local tools. Use `node = "24"` in `mise.toml` for the latest Node 24 release and pin pnpm. Keep GitHub Actions' Node version and Cloudflare's `NODE_VERSION` build variable aligned with the Node pin. Do not add `.node-version` or `.nvmrc`. Keep the pnpm `packageManager` pin in `package.json` aligned. Do not add `.tool-versions`; Cloudflare attempts to install its tools before the build. Install dependencies with `pnpm install --frozen-lockfile` and use the scripts in `package.json`.
- Approve required dependency build scripts explicitly in `pnpm-workspace.yaml`. Do not enable all dependency scripts.
- Use import aliases from `tsconfig.json`, such as `@/commands/utils.ts`. Keep the Vite alias in `vite.config.ts` in sync.
- Vite builds `src/prod.tsx` into `dist/dicer/`. Use `pnpm run deploy` to build before Wrangler deploys the generated configuration; do not restore a custom Wrangler build command.
- Define commands with `buildCommand`, validate interaction arguments with Zod, and register new commands in `src/commands.ts`.
- Keep tests next to the corresponding feature path under `test/` and name them `*.test.ts`.
- Preserve the existing TypeScript and TSX formatting. Run `pnpm run check`, `pnpm test`, and `pnpm run build` to validate changes.
- Do not commit secrets. Copy `.env.sample` to `.env` for all local tools: Wrangler, the Node socket client, and Discord maintenance tasks. Do not create `.dev.vars`; it takes precedence over `.env` in Wrangler. Migrate existing `.dev.vars` values to `.env`, then remove `.dev.vars`. Production uses Worker secrets; GitHub Actions uses repository secrets. Tests use fake bindings from `vitest.config.ts` and local D1.
- Run `pnpm run db:migrate` to apply local D1 migrations before the first development start and after new migrations are added. `dev:socket` does not apply migrations. Socket development shares `.wrangler/state/v3` with Vite. Keep `remoteBindings: false` in the socket platform proxy. Use a separate development Discord application with no interactions endpoint; never change the production endpoint for local testing.
- Cloudflare Workers Builds automatically deploys pushes to `master` to production. Preview branch deployments are disabled; other branches do not deploy.
- Pushes and merges to `master` require approval because they deploy production and trigger global Discord command registration. Manual deployments, remote migrations, and Discord maintenance tasks also require approval.

## Runtime and dependency maintenance

- Keep pnpm at `12.18.0` until you can verify the Workers Builds version. The owner decided that pnpm follows Cloudflare. The README documents the expected settings; it does not confirm the live settings. A previous read returned HTTP 403. The live version was still unverified on 2026-11-18, when the latest stable pnpm was `12.21.0`. Do not change Cloudflare settings without approval.
- Set the compatibility date in `wrangler.jsonc` and `vitest.config.ts` to a date supported by Wrangler and the Vite plugin. The Vite plugin can use an older workerd than Wrangler.
- Vitest stays at `5.1.0` because `5.1.1` has not passed pnpm's release-age policy. Update after the policy accepts it without an exclusion. Checked 2026-11-18.
- Cloudflare's tools pin Miniflare `5.20261110.0-beta` and `5.20261117.0-beta`, and unenv `2.0.0-rc.24`. Miniflare pins youch `4.1.0-beta.10` even though `4.1.1` is stable. Recheck when the upstream tools adopt newer or stable releases. Checked 2026-11-18.
- Rolldown's optional WASI binding pins `@emnapi/core` and `@emnapi/runtime` at `2.0.0-beta.2`. Recheck when Rolldown updates those pins or adopts stable v2. Checked 2026-11-18.
- The full audit reports high-severity [picomatch ReDoS](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) in `4.0.7`. It is transitive through the Vite and Vitest toolchain and is absent from the production dependency graph. No patched release was available on 2026-11-18. Recheck when a patched version is published; do not suppress the finding.
- GitHub Dependabot alerts returned HTTP 403 (disabled) on 2026-11-18. Use the full local audit until alerts are enabled.
