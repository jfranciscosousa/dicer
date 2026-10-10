import { openKv } from "@/kv.ts";
import { env } from "cloudflare:workers";

export async function clearKv() {
  await (env as { DB: D1Database }).DB.prepare("DELETE FROM macros").run();
}

export async function setMacro(
  userId: bigint,
  name: string,
  expression: string,
) {
  const kv = await openKv();
  await kv.set(["macro", userId, name], expression);
  kv.close();
}

export async function getMacro(
  userId: bigint,
  name: string,
): Promise<string | null> {
  const kv = await openKv();
  const result = await kv.get<string>(["macro", userId, name]);
  kv.close();
  return result.value;
}
