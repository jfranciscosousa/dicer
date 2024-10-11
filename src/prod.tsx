import { Context, Hono } from "hono";
import { camelize } from "camelize";
import {
  Interaction,
  InteractionResponseTypes,
  InteractionTypes,
  verifySignature,
} from "discord";
import { COMMANDS } from "@/commands.ts";
import config from "@/config.ts";
import HomePage from "@/home_page.tsx";

const app = new Hono();

async function bot(c: Context) {
  const signature = c.req.header("X-Signature-Ed25519") || "";
  const timestamp = c.req.header("X-Signature-Timestamp") || "";
  // verifySignature() verifies if the request is coming from Discord.
  // When the request's signature is not valid, we return a 401 and this is
  // important as Discord sends invalid requests to test our verification.
  const { isValid, body } = verifySignature({
    signature,
    timestamp,
    body: await c.req.text(),
    publicKey: config.DISCORD_PUBLIC_KEY,
  });

  if (!isValid) {
    return c.json({ error: "Invalid request" }, 401);
  }

  const interaction = camelize<Interaction>(JSON.parse(body)) as Interaction;

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
