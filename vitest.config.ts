import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [cloudflareTest({
    miniflare: {
      compatibilityDate: "2026-07-01",
      compatibilityFlags: ["nodejs_compat"],
      d1Databases: ["DB"],
      bindings: {
        DISCORD_APPLICATION_ID: "123456789012345678",
        DISCORD_PUBLIC_KEY: "a".repeat(64),
        DISCORD_BOT_TOKEN: "fake.bot.token",
      },
    },
  })],
  test: {
    setupFiles: ["./test/setup.ts"],
  },
});
