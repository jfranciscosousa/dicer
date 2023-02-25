import {
  getApplicationCommands,
  startBot,
  upsertApplicationCommands,
} from "discord";
import bot from "@/bot.ts";
import { COMMANDS } from "@/commands.ts";

await startBot(bot);

bot.events.ready = async (_bot, { guilds }) => {
  // Get existing commands
  const existingCommands = (await getApplicationCommands(bot)).array();

  // Add the existing ids to existing commands so we update them instead of creating
  const commandsWithId = Object.values(COMMANDS).map((command) => {
    const existingCommandId = existingCommands.find(
      (c) => c.name === command.name
    )?.id;

    if (!existingCommandId) return command;

    return { ...command, id: existingCommandId };
  });

  // For each guild, upsert existing commands
  await Promise.all(
    Array.from(guilds).map((guildId) =>
      upsertApplicationCommands(bot, commandsWithId, guildId)
    )
  );

  console.log(`Updated guilds: ${guilds.length}`);
  console.log(
    `New commands: ${commandsWithId.length - existingCommands.length}`
  );
  console.log(`Updated commands: ${existingCommands.length}`);

  Deno.exit();
};
