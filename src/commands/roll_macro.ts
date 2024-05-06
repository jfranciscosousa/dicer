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

const ROLL_MACRO_COMMAND = buildCommand({
  name: "roll_macro",
  dmPermission: true,
  description: "Roll an existing macro.",
  type: ApplicationCommandTypes.ChatInput,
  options: [
    {
      name: "macro_name",
      description: "The macro you want to roll!",
      type: ApplicationCommandOptionTypes.String,
      required: true,
    },
    {
      name: "extra_expression",
      description: "Any extra dice you want to add. eg: +8",
      type: ApplicationCommandOptionTypes.String,
      required: false,
    },
  ],
  buildArguments: (interaction: Interaction) => {
    const schema = z.object({
      macroName: z.string(),
      extraExpression: z.string().optional(),
      userId: z.string().or(z.bigint()).transform(BigInt),
    });

    return schema.parse({
      macroName: getOptionValue(interaction, "macro_name"),
      extraExpression: getOptionValue(interaction, "extra_expression"),
      userId: getUser(interaction).id,
    });
  },
  handler: async ({ macroName, extraExpression, userId }) => {
    try {
      const roller = new DiceRoller();

      const kv = await openKv();
      const macro = (await kv.get<string>(["macro", userId, macroName]))
        .value;
      kv.close();

      if (!macro) {
        return {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content:
              `I couldn't find a macro with that name <@${userId}>! Please create one first!`,
          },
        };
      }

      if (extraExpression) roller.roll(`${macro} ${extraExpression}`);
      else roller.roll(macro);

      return {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: `<@${userId}> rolled (${macroName}) ${
            roller.output.replace(":", "\n\n")
          }`,
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

export default ROLL_MACRO_COMMAND;
