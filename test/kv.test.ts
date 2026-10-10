import { expect, test } from "vitest";
import { openKv } from "@/kv.ts";
import { clearKv } from "./commands/kv_helpers.ts";

test("D1 preserves large user IDs, overwrites, long strings and sorted user-scoped lists", async () => {
  await clearKv();
  const kv = await openKv();
  const userId = 123456789012345678n;
  const expression = "1d6+".repeat(100) + "1d6";
  await kv.set(["macro", userId, "zeta"], "1d20");
  await kv.set(["macro", userId, "attack"], "1d6");
  await kv.set(["macro", userId, "attack"], expression);
  await kv.set(["macro", userId + 1n, "private"], "2d6");
  expect((await kv.get(["macro", userId, "missing"])).value).toBeNull();
  expect((await kv.get(["macro", userId, "attack"])).value).toBe(expression);
  expect((await kv.get(["macro", userId + 1n, "attack"])).value).toBeNull();
  const records = [];
  for await (const record of kv.list({ prefix: ["macro", userId] })) {
    records.push(record);
  }
  expect(records).toEqual([
    { key: ["macro", userId, "attack"], value: expression },
    { key: ["macro", userId, "zeta"], value: "1d20" },
  ]);
  await kv.set(["macro", userId, "quote' ; DROP TABLE macros; --"], "1d6");
  expect((await kv.get(["macro", userId, "zeta"])).value).toBe("1d20");
  kv.close();
});
