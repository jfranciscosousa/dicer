import {
  deleteGlobalApplicationCommand,
  deleteGuildApplicationCommand,
  getGlobalApplicationCommands,
  getGuildApplicationCommands,
  startBot,
} from "discord";
import bot from "@/bot.ts";

await startBot(bot);

bot.events.ready = async (_bot, { guilds }) => {
  // Get global commands
  const existingCommands = (await getGlobalApplicationCommands(bot)).array();

  // Delete global commands
  const deletedGlobalCommands = await Promise.all(
    existingCommands.map((c) => deleteGlobalApplicationCommand(bot, c.id)),
  );

  // Delete guild commands
  const deletedGuildCommands = (
    await Promise.all(
      guilds.map(async (guildId) => {
        const guildCommands = (
          await getGuildApplicationCommands(bot, guildId)
        ).array();

        return Promise.all(
          guildCommands.map((c) =>
            deleteGuildApplicationCommand(bot, c.id, guildId)
          ),
        );
      }),
    )
  ).flat();

  console.log(`Deleted global commands: ${deletedGlobalCommands.length}`);
  console.log(`Deleted guild commands: ${deletedGuildCommands.length}`);

  Deno.exit();
};
