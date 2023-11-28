import LIST_MACROS_COMMAND from "@/commands/list_macros.ts";
import NEW_MACRO_COMMAND from "@/commands/new_macro.ts";
import ROLL_COMMAND from "@/commands/roll.ts";
import ROLL_MACRO_COMMAND from "@/commands/roll_macro.ts";
import ROLL_STATS_COMMAND from "@/commands/roll_stats.ts";
import { Command } from "@/commands/utils.ts";

// deno-lint-ignore no-explicit-any
export const COMMANDS: Record<string, Command<any>> = {
  [ROLL_COMMAND.name]: ROLL_COMMAND,
  [ROLL_STATS_COMMAND.name]: ROLL_STATS_COMMAND,
  [NEW_MACRO_COMMAND.name]: NEW_MACRO_COMMAND,
  [ROLL_MACRO_COMMAND.name]: ROLL_MACRO_COMMAND,
  [LIST_MACROS_COMMAND.name]: LIST_MACROS_COMMAND
};
