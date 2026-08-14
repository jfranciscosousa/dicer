import { z } from "zod";

const env = Deno.env.toObject();

const configSchema = z.object({
  DISCORD_APPLICATION_ID: z.string().regex(/^\d+$/).transform(BigInt),
  DISCORD_PUBLIC_KEY: z.string(),
  DISCORD_BOT_TOKEN: z.string(),
  DEVELOPMENT: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

const parsedConfig = configSchema.safeParse(env);

if (!parsedConfig.success) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "Environment variables error, please review them!",
  );
  console.error(
    "\x1b[31m%s\x1b[0m",
    z.prettifyError(parsedConfig.error),
  );

  throw new Error("bad env variables");
}

const config = parsedConfig.data;

export default config;
