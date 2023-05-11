import { json, serve, validateRequest } from "sift";
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

serve({
  "/": HomePage,
  "/bot": bot,
});

// The main logic of the Discord Slash Command is defined in this function.
async function bot(request: Request) {
  // validateRequest() ensures that a request is of POST method and
  // has the following headers.
  const { error } = await validateRequest(request, {
    POST: {
      headers: ["X-Signature-Ed25519", "X-Signature-Timestamp"],
    },
  });
  if (error) {
    return json({ error: error.message }, { status: error.status });
  }

  const signature = request.headers.get("X-Signature-Ed25519")!;
  const timestamp = request.headers.get("X-Signature-Timestamp")!;
  // verifySignature() verifies if the request is coming from Discord.
  // When the request's signature is not valid, we return a 401 and this is
  // important as Discord sends invalid requests to test our verification.
  const { isValid, body } = verifySignature({
    signature,
    timestamp,
    body: await request.text(),
    publicKey: config.DISCORD_PUBLIC_KEY,
  });

  if (!isValid) {
    return json(
      { error: "Invalid request" },
      {
        status: 401,
      },
    );
  }

  const interaction = camelize<Interaction>(JSON.parse(body)) as Interaction;

  // Handles Discord API pings to validate webhooks
  if (interaction.type === InteractionTypes.Ping) {
    return json({
      type: InteractionResponseTypes.Pong,
    });
  }

  const commandName = interaction.data?.name;

  // If somehow we don't have a command name, return a specific error
  if (!commandName) {
    return json({
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
    return json({
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: {
        content: "Something went wrong. I was not able to find this command.",
      },
    });
  }

  return json(await command.handleInteraction(interaction));
}
