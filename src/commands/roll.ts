import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  Interaction,
  InteractionResponseTypes,
} from "discord";
import { z } from "zod";
import { DiceRoller } from "dice-roller";
import { buildCommand, getOptionValue, getUser } from "@/commands/utils.ts";

const ROLL_COMMAND = buildCommand({
  name: "roll",
  description: "Roll dice!",
  options: [
    {
      name: "expression",
      description: "The expression you want to roll. eg: 1d20 + 8",
      type: ApplicationCommandOptionTypes.String,
      required: true,
    },
  ],
  type: ApplicationCommandTypes.ChatInput,
  buildArguments: (interaction: Interaction) => {
    const schema = z.object({ user: z.bigint(), expression: z.string() });

    return schema.parse({
      user: interaction.user.id,
      expression: getOptionValue(interaction, "expression"),
    });
  },
  handler: ({ expression }, interaction) => {
    const roller = new DiceRoller();
    const user = getUser(interaction);

    roller.roll(expression);

    return {
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: {
        content: `<@${user}> rolled ${roller.output.replace(
          ":",
          "\n\n"
        )}`,
      },
    };
  },
});

export default ROLL_COMMAND;
