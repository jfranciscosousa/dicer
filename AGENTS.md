# Dicer

Deno-based Discord dice bot with slash commands, saved macros, and roll statistics. Development receives interactions through Discord's WebSocket gateway. Production runs a Hono server whose signed `POST /bot` webhook is the Discord interactions endpoint. Both modes dispatch to the same command handlers.

## Conventions

- Use Deno APIs and tasks. Do not add Node package-manager workflows.
- Use import aliases from `deno.json`, such as `@/commands/utils.ts`.
- Define commands with `buildCommand`, validate interaction arguments with Zod, and register new commands in `src/commands.ts`.
- Keep tests next to the corresponding feature path under `test/` and name them `*.test.ts`.
- Let `deno fmt` control TypeScript and TSX formatting.
- Do not commit secrets. Copy `.env.sample` for local configuration; tests use `.env.test`.
