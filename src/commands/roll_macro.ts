/// <reference lib="deno.unstable" />
import { buildCommand, getOptionValue, getUser } from "@/commands/utils.ts";
import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  Interaction,
  InteractionResponseTypes,
} from "discord";
import { z } from "zod";
import { DiceRoller } from "dice-roller";

const ROLL_MACRO_COMMAND = buildCommand({
  name: "roll_macro",
  dmPermission: true,
  description: "Roll an existing macro!",
  type: ApplicationCommandTypes.ChatInput,
  options: [
    {
      name: "macro_name",
      description: "The macro you want to roll!",
      type: ApplicationCommandOptionTypes.String,
      required: true,
    },
  ],
  buildArguments: (interaction: Interaction) => {
    const schema = z.object({
      macroName: z.string(),
      userId: z.string().or(z.bigint()).transform(BigInt),
    });

    return schema.parse({
      macroName: getOptionValue(interaction, "macro_name"),
      userId: getUser(interaction).id,
    });
  },
  handler: async ({ macroName, userId }) => {
    try {
      const roller = new DiceRoller();

      const kv = await Deno.openKv();
      const expression = (await kv.get([
        "macro",
        userId,
        macroName,
      ])) as unknown as string | undefined;
      kv.close();

      if (!expression) {
        return {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: `I couldn't find a macro with that name <@${userId}>! Please create one first!`,
          },
        };
      }

      roller.roll(expression);

      return {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: `<@${userId}> rolled ${roller.output.replace(":", "\n\n")}`,
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
