import { createBotHelpers } from "discord";
import bot from "@/bot.ts";

const {
  getGlobalApplicationCommands,
  deleteGlobalApplicationCommand,
  getGuildApplicationCommands,
  deleteGuildApplicationCommand,
} = createBotHelpers(bot);

bot.events.ready = async (_bot, { guilds }) => {
  // Get global commands
  const existingCommands = await getGlobalApplicationCommands();

  // Delete global commands
  const deletedGlobalCommands = await Promise.all(
    existingCommands.map((c) => deleteGlobalApplicationCommand(c.id)),
  );

  // Delete guild commands
  const deletedGuildCommands = (
    await Promise.all(
      guilds.map(async (guildId) => {
        const guildCommands = await getGuildApplicationCommands(guildId.id);

        return Promise.all(
          guildCommands.map((c) =>
            deleteGuildApplicationCommand(c.id, guildId.id)
          ),
        );
      }),
    )
  ).flat();

  console.log(`Deleted global commands: ${deletedGlobalCommands.length}`);
  console.log(`Deleted guild commands: ${deletedGuildCommands.length}`);

  await bot.shutdown();
  Deno.exit();
};

console.log("Starting bot");
await bot.start();
console.log("Bot started");
