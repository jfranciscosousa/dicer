import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { getPlatformProxy } from "wrangler";
import { setLocalDatabase } from "@/kv.ts";
import newMacro from "@/commands/new_macro.ts";
import listMacros from "@/commands/list_macros.ts";
import rollMacro from "@/commands/roll_macro.ts";

test("socket commands use persistent local D1 from Node", async () => {
  const path = await mkdtemp(join(tmpdir(), "dicer-socket-"));
  const options = {
    configPath: "wrangler.jsonc",
    persist: { path },
    remoteBindings: false,
  };
  let platform = await getPlatformProxy<{ DB: D1Database }>(options);
  try {
    const schema = await readFile(new URL("../migrations/0001_macros.sql", import.meta.url), "utf8");
    await platform.env.DB.exec(schema.replaceAll("\n", " "));
    setLocalDatabase(platform.env.DB);
    const userId = 123456789012345678n;
    const created = await newMacro.run({ userId, macroName: "saved", expression: "1d1+5" });
    assert.match(created.data?.content ?? "", /created your new macro/);

    await platform.dispose();
    platform = await getPlatformProxy<{ DB: D1Database }>(options);
    setLocalDatabase(platform.env.DB);

    const listed = await listMacros.run({ userId });
    assert.match(listed.data?.content ?? "", /saved: 1d1\+5/);
    const rolled = await rollMacro.run({ userId, macroName: "saved", extraExpression: undefined });
    assert.match(rolled.data?.content ?? "", /\[1\]\+5 = 6/);
    const otherUser = await listMacros.run({ userId: userId + 1n });
    assert.match(otherUser.data?.content ?? "", /don.t have macros yet/);
  } finally {
    await platform.dispose();
    await rm(path, { recursive: true, force: true });
  }
});
