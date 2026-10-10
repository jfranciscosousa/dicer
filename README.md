# Dicer

Discord dice bot on Cloudflare Workers. Hono serves the home page and
signed `POST /bot` interactions. The existing command handlers handle rolls,
statistics, and saved macros.

## Runtime and storage

Production uses the Workers runtime with Node compatibility, not Deno or a Node
server. Node 26.11.1+ runs local tools. Install dependencies with `pnpm install --frozen-lockfile`.
`mise.toml` pins Node and pnpm for local tools. GitHub Actions sets the Node
version explicitly; `package.json` pins pnpm for GitHub Actions.
Keep these pins aligned. Install the local tools with `mise install` before
installing dependencies. pnpm shares dependency files across local projects; it does not
reduce the deployed Worker bundle.

For [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/),
set `NODE_VERSION=26.11.1` and `PNPM_VERSION=12.10.1` in Build Variables and Secrets.
Keep these values aligned with the repository pins. Do not add `.tool-versions`:
Cloudflare attempts to install its tools before the build, and its build image
can lack the pnpm plugin.

Macros use Cloudflare D1 through the `DB` binding. The `macros` table stores user
IDs as text to preserve Discord snowflake precision. Its primary key combines
`user_id` and `macro_name`. Writes replace the expression for an existing macro.
Reads immediately see completed writes. Command names and responses are unchanged.

Storage starts empty. No Deno KV data is imported, deleted, or modified.
Users must recreate any old macros. `DENO_KV_ACCESS_TOKEN` is no longer used;
remove it from local and Cloudflare secrets and revoke the temporary token.

Dependency build scripts are explicitly approved in `pnpm-workspace.yaml`.
Only `esbuild` and `workerd` may run install scripts. Review new build scripts
before adding approvals; do not enable all dependency scripts. Two exact-version
release-age exceptions preserve the existing npm-locked Workers and Node types.

## Local development

```bash
mise install
pnpm install --frozen-lockfile
cp .env.sample .env
# Fill in the Discord values.
pnpm run db:migrate
pnpm run dev
```

Use one local `.env` file for Wrangler, the Node socket client, and Discord
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
`pnpm run dev` reloads source changes. `pnpm run deploy` builds with Vite before
Wrangler deploys the generated output.

### Discord socket development

Use `pnpm run dev:socket` to receive Discord interactions over WebSocket without a
public webhook or tunnel. Copy `.env.sample` to `.env` and fill in the development
bot credentials first. Run `pnpm run db:migrate` before the first start and after
new migrations are added. This separate command applies local D1 migrations and
may ask for confirmation. `dev:socket` only loads `.env` and starts the Node socket
client; it does not apply migrations. All commands, including saved macros, work through
Wrangler's local D1 platform proxy. Data persists in `.wrangler/state/v3` and uses
the same local database as Vite. This command never connects to production D1.

Use a separate Discord application and bot token for development. Its interactions
endpoint must be unset so Discord sends interactions through the socket. Do not
clear or change the production application's endpoint. Invite the development bot
to a test server and register its commands only with approval.

Use `pnpm run dev` to test the home page and signed webhook in the Workers runtime.

## Checks

```bash
pnpm run check
pnpm test
pnpm run build
```

Tests run in the Workers runtime against local D1. They apply the SQL schema and
verify signatures, webhook dispatch, macro persistence, overwrites, large user
IDs, user isolation, ordering, and long expressions. Tests never access a live
database. A separate Node test verifies socket macro creation, listing, rolling,
user isolation, and persistence through the local D1 proxy. It uses temporary
storage and never connects to Discord. `pnpm run build` creates the Workers bundle
only; it does not deploy.

## Deployment (requires approval)

Cloudflare Workers Builds automatically deploys every push to `master` to
production. Preview branch deployments are disabled; other branches do not deploy.
A push or merge to `master` therefore requires deployment approval. GitHub Actions
also registers global Discord commands on pushes to `master`.

`wrangler.jsonc` configures the production D1 database
`b8819b86-af53-49f3-8678-6a472deb1d18` with binding name `DB`.
The remote schema must be applied before macro commands can work.

After approval:

1. Apply the schema with `pnpm exec wrangler d1 migrations apply dicer --remote`,
   or execute `migrations/0001_macros.sql` in the D1 dashboard console.
2. Create or select the Cloudflare Worker named `dicer`. For Workers Builds Git
   integration, select `master` as the production branch, set the build command
   to `pnpm install --frozen-lockfile && pnpm run build`, and set the deploy command
   to `pnpm run deploy`. Set `SKIP_DEPENDENCY_INSTALL=1` to use the explicit frozen
   install instead of automatic dependency installation.
   Keep preview branch deployments disabled. No Pages output directory is required.
3. Set `DISCORD_APPLICATION_ID`, `DISCORD_PUBLIC_KEY`, and `DISCORD_BOT_TOKEN` as
   Worker secrets for the intended environment. Keep secrets out of Git. Existing
   Pages secrets do not transfer; use the dashboard or `pnpm exec wrangler secret put`.
4. Deploy through Workers Builds or `pnpm run deploy`.

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
pnpm run run --env-file=.env tasks/upsert_global_commands_task.ts
```

These tasks change Discord settings. Run them only with approval. Existing GitHub
workflows retain their registration triggers and manual task choices; merging to
`master` still triggers global command registration. No deployment workflow was
added.
