import { assertEquals, assertStringIncludes } from "@std/assert";
import NEW_MACRO_COMMAND from "@/commands/new_macro.ts";
import { InteractionResponseTypes, InteractionTypes } from "discord";
import { clearKv, getMacro } from "./kv_helpers.ts";

const USER_ID = BigInt(123456789);

function buildInteraction(macroName: string, expression: string) {
  return {
    id: BigInt(1),
    token: "test",
    type: InteractionTypes.ApplicationCommand,
    user: { id: USER_ID, username: "TestUser" },
    data: {
      name: "new_macro",
      options: [
        { name: "macro_name", value: macroName },
        { name: "expression", value: expression },
      ],
    },
  };
}

// deno-lint-ignore no-explicit-any
function getContent(result: any): string {
  return result.data.content;
}

Deno.test("new_macro - creates macro successfully", async () => {
  await clearKv();

  const result = await NEW_MACRO_COMMAND.handleInteraction(
    buildInteraction("attack", "1d20+5"),
  );

  assertEquals(result.type, InteractionResponseTypes.ChannelMessageWithSource);
  assertStringIncludes(getContent(result), `<@${USER_ID}>`);
  assertStringIncludes(getContent(result), "attack");
});

Deno.test("new_macro - macro is persisted to KV", async () => {
  await clearKv();

  await NEW_MACRO_COMMAND.handleInteraction(
    buildInteraction("fireball", "8d6"),
  );

  const stored = await getMacro(USER_ID, "fireball");
  assertEquals(stored, "8d6");
});

Deno.test("new_macro - too many dice returns chill message", async () => {
  await clearKv();

  const result = await NEW_MACRO_COMMAND.handleInteraction(
    buildInteraction("toobig", "10000000d10000000"),
  );

  assertEquals(result.type, InteractionResponseTypes.ChannelMessageWithSource);
  assertStringIncludes(getContent(result), "chill out");
});
