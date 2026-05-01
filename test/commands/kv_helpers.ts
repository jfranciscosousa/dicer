export async function clearKv() {
  const kv = await Deno.openKv();
  for await (const entry of kv.list({ prefix: [] })) {
    await kv.delete(entry.key);
  }
  kv.close();
}

export async function setMacro(
  userId: bigint,
  name: string,
  expression: string,
) {
  const kv = await Deno.openKv();
  await kv.set(["macro", userId, name], expression);
  kv.close();
}

export async function getMacro(
  userId: bigint,
  name: string,
): Promise<string | null> {
  const kv = await Deno.openKv();
  const result = await kv.get<string>(["macro", userId, name]);
  kv.close();
  return result.value;
}
