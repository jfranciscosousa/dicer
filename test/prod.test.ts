import { beforeAll, expect, test } from "vitest";
import app from "@/prod.tsx";
import getConfig from "@/config.ts";

let privateKey: CryptoKey;

beforeAll(async () => {
  const keys = await crypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ]) as CryptoKeyPair;
  privateKey = keys.privateKey;
  const raw = await crypto.subtle.exportKey("raw", keys.publicKey);
  getConfig().DISCORD_PUBLIC_KEY = Array.from(
    new Uint8Array(raw),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
});

async function interaction(payload: unknown, valid = true) {
  const body = JSON.stringify(payload);
  const timestamp = "1234567890";
  const signature = await crypto.subtle.sign(
    "Ed25519",
    privateKey,
    new TextEncoder().encode(timestamp + body),
  );
  return app.request("/bot", {
    method: "POST",
    headers: {
      "X-Signature-Timestamp": timestamp,
      "X-Signature-Ed25519": valid
        ? Array.from(
          new Uint8Array(signature),
          (byte) => byte.toString(16).padStart(2, "0"),
        ).join("")
        : "a".repeat(128),
    },
    body,
  });
}

test("home page preserves the Discord invite", async () => {
  const response = await app.request("/");
  expect(response.status).toBe(200);
  expect(await response.text()).toContain(
    `client_id=${getConfig().DISCORD_APPLICATION_ID}`,
  );
});

test("signed Discord ping returns Pong", async () => {
  const response = await interaction({ type: 1 });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ type: 1 });
});

test("invalid signature returns 401", async () => {
  expect((await interaction({ type: 1 }, false)).status).toBe(401);
});

test.each([
  ["missing headers", {}],
  ["missing signature", { "X-Signature-Timestamp": "1234567890" }],
  ["missing timestamp", { "X-Signature-Ed25519": "a".repeat(128) }],
  ["short signature", {
    "X-Signature-Timestamp": "1234567890",
    "X-Signature-Ed25519": "a".repeat(126),
  }],
  ["non-hex signature", {
    "X-Signature-Timestamp": "1234567890",
    "X-Signature-Ed25519": "g".repeat(128),
  }],
])("%s returns 401", async (_name, headers) => {
  const response = await app.request("/bot", {
    method: "POST",
    headers: headers as Record<string, string>,
    body: '{"type":1}',
  });
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "Invalid request" });
});

for (const name of [undefined, "unknown"]) {
  test(`signed ${name ?? "missing"} command preserves the error reply`, async () => {
    const response = await interaction({ type: 2, data: { name } });
    expect(await response.json()).toMatchObject({
      type: 4,
      data: { content: expect.stringContaining("Something went wrong") },
    });
  });
}

test("signed guild roll dispatches to the existing handler", async () => {
  const response = await interaction({
    type: 2,
    member: { user: { id: "123456789", username: "TestUser" } },
    data: { name: "roll", options: [{ name: "expression", value: "1d1+5" }] },
  });
  expect(await response.json()).toMatchObject({
    type: 4,
    data: { content: "<@123456789> rolled 1d1+5\n\n [1]+5 = 6" },
  });
});
