# Dicer

Discord dice bot on Cloudflare Workers. Hono serves the home page and
signed `POST /bot` interactions. The existing command handlers handle rolls,
statistics, and saved macros.

## Runtime and storage

Production uses the Workers runtime with Node compatibility, not Deno or a Node
server. Node 26.11.1+ runs local tools. Install dependencies with `npm ci`.
`.tool-versions` pins Node for local tools and GitHub Actions. `.node-version`
pins Node for Cloudflare Workers Builds. Keep both version files in sync.
A Cloudflare build variable named `NODE_VERSION`, if set, must match the pin.

Macros use Cloudflare D1 through the `DB` binding. The `macros` table stores user
IDs as text to preserve Discord snowflake precision. Its primary key combines
`user_id` and `macro_name`. Writes replace the expression for an existing macro.
Reads immediately see completed writes. Command names and responses are unchanged.

Storage starts empty. No Deno KV data is imported, deleted, or modified.
Users must recreate any old macros. `DENO_KV_ACCESS_TOKEN` is no longer used;
remove it from local and Cloudflare secrets and revoke the temporary token.

## Local development

```bash
npm ci
cp .env.sample .env
# Fill in the Discord values.
npx wrangler d1 migrations apply dicer --local
npm run dev
```

Use one local `.env` file for Wrangler, the optional Node gateway, and Discord
maintenance tasks. Wrangler loads `.env` automatically when `.dev.vars` is absent.
If you have an existing `.dev.vars`, move its values into `.env`, then remove it;
otherwise Wrangler uses `.dev.vars` instead. Keep `.env` out of Git. Production
uses Cloudflare Worker secrets; GitHub Actions uses repository secrets, not `.env`.

Vite serves `http://localhost:5173` and runs the app in the Workers runtime. `GET /` renders the existing home page;
`POST /bot` requires a valid Discord signature. Local D1 data stays in `.wrangler`
and survives restarts. No Cloudflare login or remote database is required.

[Vite with Cloudflare's plugin](https://hono.dev/docs/getting-started/cloudflare-workers-vite)
builds `src/prod.tsx` into `dist/dicer/`, including the Worker bundle and generated
Wrangler configuration. No client-side bundle or static assets are required.
`npm run dev` reloads source changes. `npm run deploy` builds with Vite before
Wrangler deploys the generated output.

The optional `npm run dev:gateway` client uses `.env` and Node. Dice-only commands
still work there, but macro commands require the Workers runtime's D1 binding and
cannot run in the Node gateway client. Use `npm run dev` to test all commands.
Do not change a live application's interaction endpoint for local testing.

## Checks

```bash
npm run check
npm test
npm run build
```

Tests run in the Workers runtime against local D1. They apply the SQL schema and
verify signatures, webhook dispatch, macro persistence, overwrites, large user
IDs, user isolation, ordering, and long expressions. Tests never access a live
database. `npm run build` creates the Workers bundle only; it does not deploy.

## Deployment (requires approval)

Cloudflare Workers Builds automatically deploys every push to `master` to
production. Preview branch deployments are disabled; other branches do not deploy.
A push or merge to `master` therefore requires deployment approval. GitHub Actions
also registers global Discord commands on pushes to `master`.

`wrangler.jsonc` configures the production D1 database
`b8819b86-af53-49f3-8678-6a472deb1d18` with binding name `DB`.
The remote schema must be applied before macro commands can work.

After approval:

1. Apply the schema with `npx wrangler d1 migrations apply dicer --remote`,
   or execute `migrations/0001_macros.sql` in the D1 dashboard console.
2. Create or select the Cloudflare Worker named `dicer`. For Workers Builds Git
   integration, select `master` as the production branch, set the build command
   to `npm run build`, and set the deploy command to `npm run deploy`.
   Keep preview branch deployments disabled. No Pages output directory is required.
3. Set `DISCORD_APPLICATION_ID`, `DISCORD_PUBLIC_KEY`, and `DISCORD_BOT_TOKEN` as
   Worker secrets for the intended environment. Keep secrets out of Git. Existing
   Pages secrets do not transfer; use the dashboard or `npx wrangler secret put`.
4. Deploy through Workers Builds or `npm run deploy`.

The compatibility date, Node compatibility flag, and production D1 binding come
from `wrangler.jsonc`. No preview branches or preview databases are configured.

On the approved environment, verify the home page, a signed Discord ping, and
macro creation, listing, overwriting, and rolling. Discord requires a response
within three seconds. Then, with separate approval, change the Discord
interactions endpoint to `https://<worker-domain>/bot`. No command registration is
needed for this runtime migration.

Keep the old service and endpoint available for rollback. D1 macros created after
cutover will not appear in the old service; rollback does not synchronize storage.

## Discord maintenance tasks

The existing command registration and deletion scripts run with Node:

```bash
npm run run -- --env-file=.env tasks/upsert_global_commands_task.ts
```

These tasks change Discord settings. Run them only with approval. Existing GitHub
workflows retain their registration triggers and manual task choices; merging to
`master` still triggers global command registration. No deployment workflow was
added.
