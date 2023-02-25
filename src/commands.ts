import { Command } from "@/commands/utils.ts";
import ROLL_COMMAND from "@/commands/roll.ts";
import ROLL_STATS_COMMAND from "@/commands/roll_stats.ts";

// deno-lint-ignore no-explicit-any
export const COMMANDS: Record<string, Command<any>> = {
  [ROLL_COMMAND.name]: ROLL_COMMAND,
  [ROLL_STATS_COMMAND.name]: ROLL_STATS_COMMAND,
};
