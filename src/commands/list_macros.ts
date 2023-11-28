/// <reference lib="deno.unstable" />
import { buildCommand, getUser } from "@/commands/utils.ts";
import {
  ApplicationCommandTypes,
  Interaction,
  InteractionResponseTypes,
} from "discord";
import { z } from "zod";

const LIST_MACROS_COMMAND = buildCommand({
  name: "list_macros",
  dmPermission: true,
  description: "List all of your macros.",
  type: ApplicationCommandTypes.ChatInput,
  buildArguments: (interaction: Interaction) => {
    const schema = z.object({
      userId: z.string().or(z.bigint()).transform(BigInt),
    });

    return schema.parse({
      userId: getUser(interaction).id,
    });
  },
  handler: async ({ userId }) => {
    try {
      const kv = await Deno.openKv();
      const macros: { key: string; value: string }[] = [];
      const iterator = kv.list<string>({ prefix: ["macro", userId] });
      for await (const macro of iterator) {
        macros.push({ key: String(macro.key[2]), value: macro.value });
      }
      kv.close();

      if (!macros.length) {
        return {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: `You don't have macros yet <@${userId}>. Please create one first.`,
          },
        };
      }

      return {
        type: InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: `
<@${userId}> these are your macros:\n
${macros.map((macro) => `- ${macro.key}: ${macro.value}`).join("\n")}
`.trim(),
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

export default LIST_MACROS_COMMAND;
