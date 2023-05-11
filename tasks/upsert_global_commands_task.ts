import bot from "@/bot.ts";
import { COMMANDS } from "@/commands.ts";
import {
  getGlobalApplicationCommands,
  startBot,
  upsertGlobalApplicationCommands,
} from "discord";

await startBot(bot);

bot.events.ready = async (_bot) => {
  // Get existing commands
  const existingCommands = (await getGlobalApplicationCommands(bot)).array();

  // Add the existing ids to existing commands so we update them instead of creating
  const commandsWithId = Object.values(COMMANDS).map((command) => {
    const existingCommandId = existingCommands.find(
      (c) => c.name === command.name,
    )?.id;

    if (!existingCommandId) return command;

    return { ...command, id: existingCommandId };
  });

  await upsertGlobalApplicationCommands(bot, commandsWithId);

  console.log(
    `New commands: ${commandsWithId.length - existingCommands.length}`,
  );
  console.log(`Updated commands: ${existingCommands.length}`);

  Deno.exit();
};
