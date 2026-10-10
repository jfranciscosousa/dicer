import { env } from "cloudflare:workers";
import schema from "../migrations/0001_macros.sql?raw";

await (env as { DB: D1Database }).DB.exec(schema.replaceAll("\n", " "));
