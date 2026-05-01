import {
  ApplicationCommandTypes,
  CreateApplicationCommand,
  InteractionResponse,
  InteractionResponseTypes,
  InteractionTypes,
} from "discord";

// Structural subset of Interaction containing only what our commands need.
// Avoids coupling to the bot's desired properties configuration — TypeScript's
// structural typing ensures both the full Interaction and the desired-props
// narrowed version satisfy this type without any casting.
type SimpleInteraction = {
  id: bigint;
  token: string;
  type: InteractionTypes;
  data?: { name?: string; options?: Array<{ name: string; value?: unknown }> };
  user?: { id: bigint; username: string };
  member?: { user?: { id: bigint; username: string } };
};

export type Command<T> = {
  handleInteraction: (
    interaction: SimpleInteraction,
  ) => Promise<InteractionResponse> | InteractionResponse;
} & (CommandWithArguments<T> | CommandWithoutArguments);

type CommandWithArguments<T> = {
  buildArguments: (interaction: SimpleInteraction) => T;

  run: (args: T) => Promise<InteractionResponse> | InteractionResponse;
} & BaseCommand;

type CommandWithoutArguments = {
  buildArguments?: undefined;

  run: () => Promise<InteractionResponse> | InteractionResponse;
} & BaseCommand;

type BaseCommand = {
  // The name of the command
  name: string;
  // The description of the command
  description: string;
  // The application command type of this command
  type: ApplicationCommandTypes;
} & CreateApplicationCommand;

type BuildCommandArgs<T> = CommandWithArguments<T> | CommandWithoutArguments;

// This functions looks useless but it actually allow us to infer types automatically.
// Check `hello.ts`. Without this we would have to explicit type `Command<{userId: bignit}>`
export function buildCommand<T>(commandProps: BuildCommandArgs<T>): Command<T> {
  if (!commandProps.buildArguments) {
    return {
      ...commandProps,
      handleInteraction: () => {
        try {
          return commandProps.run();
        } catch (error) {
          console.error(error);

          return {
            type: InteractionResponseTypes.ChannelMessageWithSource,
            data: { content: "Unhandled error!" },
          };
        }
      },
    };
  }

  return {
    ...commandProps,
    handleInteraction: (i) => {
      try {
        return commandProps.run(commandProps.buildArguments(i));
      } catch (error) {
        console.error(error);

        return {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: { content: "Unhandled error!" },
        };
      }
    },
  };
}

export function getOptionValue(
  interaction: SimpleInteraction,
  optionName: string,
) {
  return interaction.data?.options?.find((option) => option.name === optionName)
    ?.value;
}

export function getUser(interaction: SimpleInteraction): {
  id: bigint;
  username: string;
} {
  const user = interaction.user ?? interaction.member?.user;
  if (!user) throw new Error("Interaction has no user or member");
  return user;
}
