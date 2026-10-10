# Dicer

Discord dice bot on Cloudflare Workers with slash commands, saved macros, and roll statistics. Hono handles signed `POST /bot` interactions. Macros use Cloudflare D1 through the `DB` binding. Local development uses Vite with `@cloudflare/vite-plugin` in the Workers runtime. `npm run dev:socket` receives Discord interactions over WebSocket in Node and uses Wrangler's local D1 platform proxy with the same command handlers.

## Conventions

- Use Workers APIs for production and Node 26.11.1+ for local tools. Pin Node in `.tool-versions`. Install dependencies with `npm ci` and use the scripts in `package.json`.
- Use import aliases from `tsconfig.json`, such as `@/commands/utils.ts`. Keep the Vite alias in `vite.config.ts` in sync.
- Vite builds `src/prod.tsx` into `dist/dicer/`. Use `npm run deploy` to build before Wrangler deploys the generated configuration; do not restore a custom Wrangler build command.
- Define commands with `buildCommand`, validate interaction arguments with Zod, and register new commands in `src/commands.ts`.
- Keep tests next to the corresponding feature path under `test/` and name them `*.test.ts`.
- Preserve the existing TypeScript and TSX formatting. Run `npm run check`, `npm test`, and `npm run build` to validate changes.
- Do not commit secrets. Copy `.env.sample` to `.env` for all local tools: Wrangler, the Node socket client, and Discord maintenance tasks. Do not create `.dev.vars`; it takes precedence over `.env` in Wrangler. Migrate existing `.dev.vars` values to `.env`, then remove `.dev.vars`. Production uses Worker secrets; GitHub Actions uses repository secrets. Tests use fake bindings from `vitest.config.ts` and local D1.
- Run `npm run db:migrate` to apply local D1 migrations before the first development start and after new migrations are added. `dev:socket` does not apply migrations. Socket development shares `.wrangler/state/v3` with Vite. Keep `remoteBindings: false` in the socket platform proxy. Use a separate development Discord application with no interactions endpoint; never change the production endpoint for local testing.
- Cloudflare Workers Builds automatically deploys pushes to `master` to production. Preview branch deployments are disabled; other branches do not deploy.
- Pushes and merges to `master` require approval because they deploy production and trigger global Discord command registration. Manual deployments, remote migrations, and Discord maintenance tasks also require approval.
