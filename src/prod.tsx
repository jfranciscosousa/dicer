import { Context, Hono } from "hono";
import { logger } from "hono/logger";
import camelcaseKeys from "camelcase-keys";
import {
  Interaction,
  InteractionResponseTypes,
  InteractionTypes,
} from "discord";
import { COMMANDS } from "@/commands.ts";
import config from "@/config.ts";
import HomePage from "@/home_page.tsx";
import { verifyDiscordSignature } from "@/verifyDiscordSignature.ts";

async function commandLogger(c: Context, next: () => Promise<void>) {
  try {
    const body = await c.req.text();
    const payload = JSON.parse(body);
    const commandName = payload?.data?.name;
    const options = payload?.data?.options as
      | Array<{ name: string; value: unknown }>
      | undefined;
    const args = options?.map(({ name, value }) => `${name}=${value}`).join(
      " ",
    );
    if (commandName) console.log(`Command: ${commandName}${args ? ` ${args}` : ""}`);
  } catch {
    console.log("Malformed request, invalid JSON");
  }
  await next();
}

const app = new Hono();
app.use(logger());
app.use("/bot", commandLogger);

async function bot(c: Context) {
  const signature = c.req.header("X-Signature-Ed25519") || "";
  const timestamp = c.req.header("X-Signature-Timestamp") || "";
  const body = await c.req.text();
  const isValid = await verifyDiscordSignature(
    config.DISCORD_PUBLIC_KEY,
    signature,
    timestamp,
    body,
  );

  if (!isValid) {
    return c.json({ error: "Invalid request" }, 401);
  }

  const interaction = camelcaseKeys<Interaction>(JSON.parse(body));

  // Handles Discord API pings to validate webhooks
  if (interaction.type === InteractionTypes.Ping) {
    return c.json({
      type: InteractionResponseTypes.Pong,
    });
  }

  const commandName = interaction.data?.name;

  // If somehow we don't have a command name, return a specific error
  if (!commandName) {
    return c.json({
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: {
        content:
          "Something went wrong. I was not able to find the command name in the payload sent by Discord.",
      },
    });
  }

  const command = COMMANDS[commandName];

  // If somehow, we receive a command for which we have no handlers, return a specific error
  if (!command) {
    return c.json({
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: {
        content: "Something went wrong. I was not able to find this command.",
      },
    });
  }

  return c.json(await command.handleInteraction(interaction));
}

app.get("/", (c) => c.html(<HomePage />));
app.post("/bot", (c) => bot(c));

Deno.serve(app.fetch);
