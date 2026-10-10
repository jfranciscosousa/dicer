# Dicer

Discord dice bot on Cloudflare Workers with slash commands, saved macros, and roll statistics. Hono handles signed `POST /bot` interactions. Macros use Cloudflare D1 through the `DB` binding. Local development uses Wrangler. The optional Node gateway client uses the same command handlers, but cannot run macro commands without D1.

## Conventions

- Use Workers APIs for production and Node 26.11.1+ for local tools. Keep `.tool-versions` and `.node-version` in sync. Install dependencies with `npm ci` and use the scripts in `package.json`.
- Use import aliases from `tsconfig.json`, such as `@/commands/utils.ts`.
- Define commands with `buildCommand`, validate interaction arguments with Zod, and register new commands in `src/commands.ts`.
- Keep tests next to the corresponding feature path under `test/` and name them `*.test.ts`.
- Preserve the existing TypeScript and TSX formatting. Run `npm run check`, `npm test`, and `npm run build` to validate changes.
- Do not commit secrets. Copy `.dev.vars.sample` to `.dev.vars` for Wrangler or `.env.sample` to `.env` for the optional gateway client. Tests use fake bindings from `vitest.config.ts` and local D1.
- Deployments, remote migrations, and Discord maintenance tasks require approval.
