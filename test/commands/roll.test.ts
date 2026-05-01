import { assertEquals, assertStringIncludes } from "@std/assert";
import ROLL_COMMAND from "@/commands/roll.ts";
import { InteractionResponseTypes, InteractionTypes } from "discord";

const USER_ID = BigInt(123456789);

function buildInteraction(expression: string) {
  return {
    id: BigInt(1),
    token: "test",
    type: InteractionTypes.ApplicationCommand,
    user: { id: USER_ID, username: "TestUser" },
    data: {
      name: "roll",
      options: [{ name: "expression", value: expression }],
    },
  };
}

// deno-lint-ignore no-explicit-any
function getContent(result: any): string {
  return result.data.content;
}

Deno.test("roll - valid expression returns rolled result", async () => {
  const result = await ROLL_COMMAND.handleInteraction(buildInteraction("1d6"));

  assertEquals(result.type, InteractionResponseTypes.ChannelMessageWithSource);
  assertStringIncludes(getContent(result), `<@${USER_ID}>`);
  assertStringIncludes(getContent(result), "rolled");
});

Deno.test("roll - too many dice returns chill message", async () => {
  const result = await ROLL_COMMAND.handleInteraction(
    buildInteraction("10000000d10000000"),
  );

  assertEquals(result.type, InteractionResponseTypes.ChannelMessageWithSource);
  assertStringIncludes(getContent(result), "chill out");
});
