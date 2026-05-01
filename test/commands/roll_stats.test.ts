import { assertEquals, assertStringIncludes } from "@std/assert";
import ROLL_STATS_COMMAND from "@/commands/roll_stats.ts";
import { InteractionResponseTypes, InteractionTypes } from "discord";

const USER_ID = BigInt(123456789);

const interaction = {
  id: BigInt(1),
  token: "test",
  type: InteractionTypes.ApplicationCommand,
  user: { id: USER_ID, username: "TestUser" },
  data: { name: "roll_stats", options: [] },
};

// deno-lint-ignore no-explicit-any
function getContent(result: any): string {
  return result.data.content;
}

Deno.test("roll_stats - returns 6 stat values", async () => {
  const result = await ROLL_STATS_COMMAND.handleInteraction(interaction);

  assertEquals(result.type, InteractionResponseTypes.ChannelMessageWithSource);

  const content = getContent(result);
  assertStringIncludes(content, `<@${USER_ID}>`);
  assertStringIncludes(content, "stats are");

  const statsLine = content.split("\n\n")[1].trim();
  const stats = statsLine.split(" ").map(Number);
  assertEquals(stats.length, 6);
  for (const stat of stats) {
    assertEquals(stat >= 3 && stat <= 18, true);
  }
});

Deno.test("roll_stats - at least one stat is >= 15", async () => {
  const result = await ROLL_STATS_COMMAND.handleInteraction(interaction);

  const content = getContent(result);
  const statsLine = content.split("\n\n")[1].trim();
  const stats = statsLine.split(" ").map(Number);

  assertEquals(stats.some((s) => s >= 15), true);
});
