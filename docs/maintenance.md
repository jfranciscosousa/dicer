# Runtime and dependency maintenance

## Runtime and build settings

- Use Workers APIs in production and Node 24 LTS for local tools. Keep `node = "24"` in
  [`mise.toml`](../mise.toml), the GitHub Actions Node version, and the Cloudflare `NODE_VERSION`
  build variable aligned. Do not add `.node-version`, `.nvmrc`, or `.tool-versions`. Cloudflare tries
  to install tools from `.tool-versions` before the build, and the build image can lack the pnpm plugin.
- Keep the pnpm pins in `mise.toml` and [`package.json`](../package.json) at `12.18.0` until you can
  verify the Workers Builds version. The owner decided that pnpm follows Cloudflare. The
  [README](../README.md) lists the expected settings, not the live settings. A previous read returned
  HTTP 403. The live version was still unverified on 2026-11-18, when the latest stable pnpm was
  `12.21.0`. Do not change Cloudflare settings without approval.
- Use `pnpm install --frozen-lockfile` and the scripts in `package.json`. Approve required dependency
  build scripts explicitly in [`pnpm-workspace.yaml`](../pnpm-workspace.yaml). Do not enable all
  dependency scripts.
- Keep the compatibility date in [`wrangler.jsonc`](../wrangler.jsonc) and
  [`vitest.config.ts`](../vitest.config.ts) aligned. Use a date supported by Wrangler and the Vite
  plugin. The plugin can use an older workerd than Wrangler. On 2026-11-18, the plugin's workerd
  supported `2026-11-10`, the date set in both files.
- Vite builds `src/prod.tsx` into `dist/dicer/`. For an approved deployment, `pnpm run deploy` builds
  before Wrangler deploys the generated configuration. Do not restore a custom Wrangler build command.
- Per the README, Cloudflare Workers Builds deploys pushes to `master` to production, and preview
  branch deployments are disabled. The GitHub Actions workflow also registers global Discord
  commands on pushes to `master`. Obtain approval before a push or merge to `master`.

## Temporary pins and upstream constraints

- Vitest stays at `5.1.0` because `5.1.1` has not passed pnpm's release-age policy. Update after the
  policy accepts it without an exclusion. Checked 2026-11-18.
- Cloudflare's tools pin Miniflare `5.20261110.0-beta` and `5.20261117.0-beta`, and unenv `2.0.0-rc.24`.
  Miniflare pins youch `4.1.0-beta.10` even though `4.1.1` is stable. Recheck when the upstream tools
  adopt newer or stable releases. Checked 2026-11-18.
- Rolldown's optional WASI binding pins `@emnapi/core` and `@emnapi/runtime` at `2.0.0-beta.2`.
  Recheck when Rolldown updates those pins or adopts stable v2. Checked 2026-11-18.

## Audit

- The full audit reports high-severity [picomatch ReDoS](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)
  in `4.0.7`. It is transitive through the Vite and Vitest toolchain and is absent from the production
  dependency graph. No patched release was available on 2026-11-18. Recheck when a patched version
  is published. Do not suppress the finding.
- GitHub Dependabot alerts returned HTTP 403 (disabled) on 2026-11-18. Use the full local audit until
  alerts are enabled.
- The dice roller upgrade to `5.5.3` removed the need for the `mathjs` override. It resolves to
  `mathjs 15.2.0` without an override. The production audit was clean on 2026-11-18.

## Verification

Run the frozen install, `pnpm run check`, `pnpm test`, and `pnpm run build`. The test suite uses local
D1 and fake Discord bindings. Its Node socket test uses temporary storage and does not connect to
Discord. For a migration or Workers HTTP smoke test, use separate local D1 storage, fake bindings,
and a unique port. Remove temporary storage after the check.
