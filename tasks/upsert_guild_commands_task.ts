import {
  ApplicationCommand,
  createBotHelpers,
  DiscordUnavailableGuild,
} from "discord";
import bot from "@/bot.ts";
import { COMMANDS } from "@/commands.ts";

const {
  getGuildApplicationCommands,
  upsertGuildApplicationCommands,
} = createBotHelpers(bot);

async function fetchAllCommands(
  guilds: DiscordUnavailableGuild[],
): Promise<ApplicationCommand[]> {
  const commands = await Promise.all(
    guilds.flatMap(async (
      guild,
    ) => (await getGuildApplicationCommands(guild.id))),
  );

  return commands.flat();
}

bot.events.ready = async (_bot, { guilds }) => {
  // Get existing commands
  const existingCommands = await fetchAllCommands(guilds);

  // Add the existing ids to existing commands so we update them instead of creating
  const commandsWithId = Object.values(COMMANDS).map((command) => {
    const existingCommandId = existingCommands.find(
      (c) => c.name === command.name,
    )?.id;

    if (!existingCommandId) return command;

    return { ...command, id: existingCommandId };
  });

  // For each guild, upsert existing commands
  await Promise.all(
    Array.from(guilds).map((guildId) =>
      upsertGuildApplicationCommands(guildId.id, commandsWithId)
    ),
  );

  console.log(`Updated guilds: ${guilds.length}`);
  console.log(
    `New commands: ${commandsWithId.length - existingCommands.length}`,
  );
  console.log(`Updated commands: ${existingCommands.length}`);

  Deno.exit();
};

console.log("Starting bot");
await bot.start();
console.log("Bot started");
