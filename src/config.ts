import { z } from "zod";
import { generateErrorMessage } from "zod-error";

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
    // deno-lint-ignore no-explicit-any
    generateErrorMessage(parsedConfig.error.issues as any, {
      delimiter: { error: "\n" },
    }),
  );

  throw new Error("bad env variables");
}

const config = parsedConfig.data;

export default config;
