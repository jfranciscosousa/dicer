type MacroKey = readonly [string, bigint, string];

let localDatabase: D1Database | undefined;

export function setLocalDatabase(database: D1Database) {
  localDatabase = database;
}

export async function openKv() {
  const db = localDatabase ??
    ((await import("cloudflare:workers")).env as { DB?: D1Database }).DB;
  if (!db) throw new Error("The D1 binding DB is required for macros");

  return {
    async set(key: MacroKey, expression: string) {
      await db.prepare(
        "INSERT INTO macros (user_id, macro_name, expression) VALUES (?, ?, ?) " +
          "ON CONFLICT (user_id, macro_name) DO UPDATE SET expression = excluded.expression",
      ).bind(String(key[1]), key[2], expression).run();
    },
    async get<T = string>(key: MacroKey): Promise<{ value: T | null }> {
      const row = await db.prepare(
        "SELECT expression FROM macros WHERE user_id = ? AND macro_name = ?",
      ).bind(String(key[1]), key[2]).first<{ expression: T }>();
      return { value: row?.expression ?? null };
    },
    async *list<T = string>({ prefix }: { prefix: readonly [string, bigint] }) {
      const { results } = await db.prepare(
        "SELECT macro_name, expression FROM macros WHERE user_id = ? ORDER BY macro_name COLLATE BINARY",
      ).bind(String(prefix[1])).all<{ macro_name: string; expression: T }>();
      for (const row of results) {
        yield {
          key: ["macro", prefix[1], row.macro_name],
          value: row.expression,
        };
      }
    },
    close() {},
  };
}
