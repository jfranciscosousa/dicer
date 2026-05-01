import { assertEquals } from "@std/assert";
import { verifyDiscordSignature } from "@/verifyDiscordSignature.ts";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ]) as Promise<CryptoKeyPair>;
}

async function sign(
  privateKey: CryptoKey,
  timestamp: string,
  body: string,
): Promise<string> {
  const data = new TextEncoder().encode(timestamp + body);
  const sig = await crypto.subtle.sign("Ed25519", privateKey, data);
  return bytesToHex(new Uint8Array(sig));
}

async function exportPublicKeyHex(publicKey: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", publicKey);
  return bytesToHex(new Uint8Array(raw));
}

Deno.test("verifyDiscordSignature - valid signature returns true", async () => {
  const { privateKey, publicKey } = await generateKeyPair();
  const publicKeyHex = await exportPublicKeyHex(publicKey);
  const timestamp = "1234567890";
  const body = '{"type":1}';
  const signature = await sign(privateKey, timestamp, body);

  const result = await verifyDiscordSignature(
    publicKeyHex,
    signature,
    timestamp,
    body,
  );

  assertEquals(result, true);
});

Deno.test("verifyDiscordSignature - invalid signature returns false", async () => {
  const { publicKey } = await generateKeyPair();
  const publicKeyHex = await exportPublicKeyHex(publicKey);
  const timestamp = "1234567890";
  const body = '{"type":1}';
  const badSignature = "a".repeat(128);

  const result = await verifyDiscordSignature(
    publicKeyHex,
    badSignature,
    timestamp,
    body,
  );

  assertEquals(result, false);
});

Deno.test("verifyDiscordSignature - tampered body returns false", async () => {
  const { privateKey, publicKey } = await generateKeyPair();
  const publicKeyHex = await exportPublicKeyHex(publicKey);
  const timestamp = "1234567890";
  const body = '{"type":1}';
  const signature = await sign(privateKey, timestamp, body);

  const result = await verifyDiscordSignature(
    publicKeyHex,
    signature,
    timestamp,
    '{"type":2}',
  );

  assertEquals(result, false);
});

Deno.test("verifyDiscordSignature - tampered timestamp returns false", async () => {
  const { privateKey, publicKey } = await generateKeyPair();
  const publicKeyHex = await exportPublicKeyHex(publicKey);
  const timestamp = "1234567890";
  const body = '{"type":1}';
  const signature = await sign(privateKey, timestamp, body);

  const result = await verifyDiscordSignature(
    publicKeyHex,
    signature,
    "9999999999",
    body,
  );

  assertEquals(result, false);
});

Deno.test("verifyDiscordSignature - wrong public key returns false", async () => {
  const { privateKey } = await generateKeyPair();
  const { publicKey: otherPublicKey } = await generateKeyPair();
  const otherPublicKeyHex = await exportPublicKeyHex(otherPublicKey);
  const timestamp = "1234567890";
  const body = '{"type":1}';
  const signature = await sign(privateKey, timestamp, body);

  const result = await verifyDiscordSignature(
    otherPublicKeyHex,
    signature,
    timestamp,
    body,
  );

  assertEquals(result, false);
});
