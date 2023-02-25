import { config as dotenv } from "dotenv";
import { z } from "zod";
import { generateErrorMessage } from "zod-error";

function loadEnv() {
  // Deno.readFileSync doesn't exist on serverless contexts
  if (typeof Deno.readFileSync === "undefined") return Deno.env.toObject();

  const localDotenvConfig = dotenv();

  // Only use dotenv if a DEVELOPMENT flag exists
  if (localDotenvConfig.DEVELOPMENT === "true") return localDotenvConfig;

  return Deno.env.toObject();
}

const env = loadEnv();

const configSchema = z.object({
  DISCORD_APPLICATION_ID: z.string().regex(/^\d+$/).transform(BigInt),
  DISCORD_PUBLIC_KEY: z.string(),
  DISCORD_BOT_TOKEN: z.string(),
});

const parsedConfig = configSchema.safeParse(env);

if (!parsedConfig.success) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "Environment variables error, please review them!"
  );
  console.error(
    "\x1b[31m%s\x1b[0m",
    generateErrorMessage(parsedConfig.error.issues, {
      delimiter: { error: "\n" },
    })
  );
  Deno.exit(-1);
}

const config = parsedConfig.data;

export default config;
