import {
  ApplicationCommandTypes,
  CreateApplicationCommand,
  Interaction,
  InteractionResponse,
  InteractionResponseTypes,
} from "discord";

export type Command<T> = {
  // The handler called by our `dev.ts` and `prod.ts` modules
  handleInteraction: (
    interaction: Interaction,
  ) => Promise<InteractionResponse> | InteractionResponse;
} & (CommandWithArguments<T> | CommandWithoutArguments);

type CommandWithArguments<T> = {
  buildArguments: (interaction: Interaction) => T;

  handler: (args: T) => Promise<InteractionResponse> | InteractionResponse;
} & BaseCommand;

type CommandWithoutArguments = {
  buildArguments?: undefined;

  handler: () => Promise<InteractionResponse> | InteractionResponse;
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
          return commandProps.handler();
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
        return commandProps.handler(commandProps.buildArguments(i));
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

export function getOptionValue(interaction: Interaction, optionName: string) {
  return interaction.data?.options?.find((option) => option.name === optionName)
    ?.value;
}

export function getUser(interaction: Interaction): {
  id: bigint;
  username: string;
} {
  return interaction.user || interaction.member?.user;
}
