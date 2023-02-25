import { buildCommand, getUser } from "@/commands/utils.ts";
import { DiceRoller } from "dice-roller";
import { ApplicationCommandTypes, InteractionResponseTypes } from "discord";

function rollStats(): DiceRoller | void {
  const roller = new DiceRoller();
  let done = false;
  let iterations = 0;

  while (!done) {
    roller.roll("4d6dl1", "4d6dl1", "4d6dl1", "4d6dl1", "4d6dl1", "4d6dl1");

    done = roller.log.some((roll) => roll.total >= 15);

    if (!done) {
      roller.clearLog();
      iterations += 1;
      if (iterations > 100) return;
    }
  }

  return roller;
}

const ROLL_STATS_COMMAND = buildCommand({
  name: "roll_stats",
  description:
    "Rolls stat for your character. 4d6, drops the lowest and enforces at least 1 stat with 15.",
  type: ApplicationCommandTypes.ChatInput,
  handler: (interaction) => {
    const roller = rollStats();
    const user = getUser(interaction);

    if (!roller)
      return {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: `<@${user}> sorry but the stat rolling exploded. Please try again!`,
        },
      };

    return {
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: {
        content: `<@${user}> your stats are: \n\n${roller.log
          .map((log) => log.total)
          .join(" ")}`,
      },
    };
  },
});

export default ROLL_STATS_COMMAND;
