import {
  deleteApplicationCommand,
  getApplicationCommands,
  startBot,
} from "discord";
import bot from "@/bot.ts";

await startBot(bot);

bot.events.ready = async (_bot, { guilds }) => {
  // Get global commands
  const existingCommands = (await getApplicationCommands(bot)).array();

  // Delete global commands
  const deletedGlobalCommands = await Promise.all(
    existingCommands.map((c) => deleteApplicationCommand(bot, c.id))
  );

  // Delete guild commands
  const deletedGuildCommands = (
    await Promise.all(
      guilds.map(async (guildId) => {
        const guildCommands = (
          await getApplicationCommands(bot, guildId)
        ).array();

        return Promise.all(
          guildCommands.map((c) => deleteApplicationCommand(bot, c.id, guildId))
        );
      })
    )
  ).flat();

  console.log(`Deleted global commands: ${deletedGlobalCommands.length}`);
  console.log(`Deleted guild commands: ${deletedGuildCommands.length}`);

  Deno.exit();
};
