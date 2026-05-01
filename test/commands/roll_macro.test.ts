import { assertEquals, assertStringIncludes } from "@std/assert";
import ROLL_MACRO_COMMAND from "@/commands/roll_macro.ts";
import { InteractionResponseTypes, InteractionTypes } from "discord";
import { clearKv, setMacro } from "./kv_helpers.ts";

const USER_ID = BigInt(123456789);

function buildInteraction(macroName: string, extraExpression?: string) {
  return {
    id: BigInt(1),
    token: "test",
    type: InteractionTypes.ApplicationCommand,
    user: { id: USER_ID, username: "TestUser" },
    data: {
      name: "roll_macro",
      options: [
        { name: "macro_name", value: macroName },
        ...(extraExpression
          ? [{ name: "extra_expression", value: extraExpression }]
          : []),
      ],
    },
  };
}

// deno-lint-ignore no-explicit-any
function getContent(result: any): string {
  return result.data.content;
}

Deno.test("roll_macro - missing macro returns not found message", async () => {
  await clearKv();

  const result = await ROLL_MACRO_COMMAND.handleInteraction(
    buildInteraction("nonexistent"),
  );

  assertEquals(result.type, InteractionResponseTypes.ChannelMessageWithSource);
  assertStringIncludes(getContent(result), "couldn't find");
  assertStringIncludes(getContent(result), `<@${USER_ID}>`);
});

Deno.test("roll_macro - existing macro is rolled", async () => {
  await clearKv();
  await setMacro(USER_ID, "attack", "1d20+5");

  const result = await ROLL_MACRO_COMMAND.handleInteraction(
    buildInteraction("attack"),
  );

  assertEquals(result.type, InteractionResponseTypes.ChannelMessageWithSource);
  assertStringIncludes(getContent(result), `<@${USER_ID}>`);
  assertStringIncludes(getContent(result), "attack");
  assertStringIncludes(getContent(result), "rolled");
});

Deno.test("roll_macro - macro with extra expression is rolled", async () => {
  await clearKv();
  await setMacro(USER_ID, "base", "1d20");

  const result = await ROLL_MACRO_COMMAND.handleInteraction(
    buildInteraction("base", "+5"),
  );

  assertEquals(result.type, InteractionResponseTypes.ChannelMessageWithSource);
  assertStringIncludes(getContent(result), `<@${USER_ID}>`);
  assertStringIncludes(getContent(result), "base");
});
