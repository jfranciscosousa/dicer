import { z } from "zod";

const configSchema = z.object({
  DISCORD_APPLICATION_ID: z.string().regex(/^\d+$/).transform(BigInt),
  DISCORD_PUBLIC_KEY: z.string(),
  DISCORD_BOT_TOKEN: z.string(),
  DEVELOPMENT: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

let config: z.infer<typeof configSchema> | undefined;

export default function getConfig() {
  // Workers bindings are available during requests, not deployment validation.
  return config ??= configSchema.parse(process.env);
}
