import config from "@/config.ts";

export function openKv() {
  if (config.DEVELOPMENT) return Deno.openKv();

  return Deno.openKv(
    "https://api.deno.com/databases/40e9b4fb-9248-4885-87cf-6dca0e7af306/connect",
  );
}
