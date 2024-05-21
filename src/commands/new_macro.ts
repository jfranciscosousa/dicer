/// <reference lib="deno.unstable" />
import { buildCommand, getOptionValue, getUser } from "@/commands/utils.ts";
import { openKv } from "@/kv.ts";
import { DiceRoller } from "dice-roller";
import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  Interaction,
  InteractionResponseTypes,
} from "discord";
import { z } from "zod";

const NEW_MACRO_COMMAND = buildCommand({
  name: "new_macro",
  dmPermission: true,
  description: "Create a new macro. A dice expression you can reuse quickly.",
  type: ApplicationCommandTypes.ChatInput,
  options: [
    {
      name: "macro_name",
      description: "The name you want to give this macro.",
      type: ApplicationCommandOptionTypes.String,
      required: true,
    },
    {
      name: "expression",
      description: "The expression you want to save. eg: 1d20 + 8",
      type: ApplicationCommandOptionTypes.String,
      required: true,
    },
  ],
  buildArguments: (interaction: Interaction) => {
    const schema = z.object({
      macroName: z.string(),
      expression: z.string(),
      userId: z.string().or(z.bigint()).transform(BigInt),
    });

    return schema.parse({
      macroName: getOptionValue(interaction, "macro_name"),
      expression: getOptionValue(interaction, "expression"),
      userId: getUser(interaction).id,
    });
  },
  handler: async ({ macroName, expression, userId }) => {
    try {
      const roller = new DiceRoller();

      roller.roll(expression);

      const kv = await openKv();
      await kv.set(["macro", userId, macroName], expression);
      kv.close();

      return {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content:
            `<@${userId}> you just created your new macro! Enjoy. Just write down \`/roll_macro ${macroName}\` now!`,
        },
      };
    } catch (error) {
      if (error instanceof RangeError) {
        return {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: `Hey <@${userId}> chill out. That's way too many dice!`,
          },
        };
      }

      throw error;
    }
  },
});

export default NEW_MACRO_COMMAND;
