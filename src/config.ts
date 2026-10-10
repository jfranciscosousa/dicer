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
  if (config) return config;

  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues.map((issue) =>
      `${issue.path.join(".")}: ${issue.message}`
    ).join("; ");
    const message =
      `Invalid Worker runtime configuration: ${details}. Check Settings > Variables and Secrets, not build variables.`;
    console.error(message);
    throw new Error(message);
  }

  return config = result.data;
}
