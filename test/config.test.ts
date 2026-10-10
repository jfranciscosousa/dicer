import { expect, test, vi } from "vitest";

test("config imports without bindings and validates on first use", async () => {
  vi.resetModules();
  vi.stubEnv("DISCORD_APPLICATION_ID", undefined);
  vi.stubEnv("DISCORD_PUBLIC_KEY", undefined);
  vi.stubEnv("DISCORD_BOT_TOKEN", undefined);
  try {
    const { default: getConfig } = await import("@/config.ts");
    expect(() => getConfig()).toThrow();

    vi.stubEnv("DISCORD_APPLICATION_ID", "123456789012345678");
    vi.stubEnv("DISCORD_PUBLIC_KEY", "a".repeat(64));
    vi.stubEnv("DISCORD_BOT_TOKEN", "fake.bot.token");
    expect(getConfig()).toMatchObject({
      DISCORD_APPLICATION_ID: 123456789012345678n,
      DISCORD_PUBLIC_KEY: "a".repeat(64),
      DISCORD_BOT_TOKEN: "fake.bot.token",
    });
    expect(getConfig()).toBe(getConfig());
  } finally {
    vi.unstubAllEnvs();
    vi.resetModules();
  }
});
