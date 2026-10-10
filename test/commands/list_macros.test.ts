import { test } from "vitest";
import { assertEquals, assertStringIncludes } from "../assert.ts";
import LIST_MACROS_COMMAND from "@/commands/list_macros.ts";
import { InteractionResponseTypes, InteractionTypes } from "discord";
import { clearKv, setMacro } from "./kv_helpers.ts";

const USER_ID = BigInt(123456789);

const interaction = {
  id: BigInt(1),
  token: "test",
  type: InteractionTypes.ApplicationCommand,
  user: { id: USER_ID, username: "TestUser" },
  data: { name: "list_macros", options: [] },
};

function getContent(result: any): string {
  return result.data.content;
}

test("list_macros - no macros returns empty message", async () => {
  await clearKv();

  const result = await LIST_MACROS_COMMAND.handleInteraction(interaction);

  assertEquals(result.type, InteractionResponseTypes.ChannelMessageWithSource);
  assertStringIncludes(getContent(result), "don't have macros");
  assertStringIncludes(getContent(result), `<@${USER_ID}>`);
});

test("list_macros - lists all macros with names and expressions", async () => {
  await clearKv();
  await setMacro(USER_ID, "attack", "1d20+5");
  await setMacro(USER_ID, "fireball", "8d6");

  const result = await LIST_MACROS_COMMAND.handleInteraction(interaction);

  assertEquals(result.type, InteractionResponseTypes.ChannelMessageWithSource);

  const content = getContent(result);
  assertStringIncludes(content, `<@${USER_ID}>`);
  assertStringIncludes(content, "attack");
  assertStringIncludes(content, "1d20+5");
  assertStringIncludes(content, "fireball");
  assertStringIncludes(content, "8d6");
});

test("list_macros - only shows macros for the current user", async () => {
  await clearKv();
  await setMacro(USER_ID, "myattack", "1d20");
  await setMacro(BigInt(999), "theirattack", "2d6");

  const result = await LIST_MACROS_COMMAND.handleInteraction(interaction);

  const content = getContent(result);
  assertStringIncludes(content, "myattack");
  assertEquals(content.includes("theirattack"), false);
});
