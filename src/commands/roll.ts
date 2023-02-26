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
    const schema = z.object({
      expression: z.string(),
      userId: z.string().or(z.bigint()).transform(BigInt),
    });

    return schema.parse({
      expression: getOptionValue(interaction, "expression"),
      userId: getUser(interaction).id,
    });
  },
  handler: ({ expression, userId }) => {
    try {
      const roller = new DiceRoller();

      roller.roll(expression);

      return {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: `<@${userId}> rolled ${roller.output.replace(":", "\n\n")}`,
        },
      };
    } catch (error) {
      if (error instanceof RangeError)
        return {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: `Hey <@${userId}> chill out. That's way too many dice!`,
          },
        };

      throw error;
    }
  },
});

export default ROLL_COMMAND;
