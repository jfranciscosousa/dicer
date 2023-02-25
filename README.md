# deno-discord-template

This is a small and slim template for serverless Discord bots using Discord's Command API and Deno.

## Serverless?

Yes, we can run Discord bots without a server as long as we use the Command API and we don't need to do anything regarding voices, presences, and other live data stuff.

Instead, we can use the Discord `interactions endpoint url` so that commands get forwarded to an HTTP gateway instead. Our serverless Deno HTTP API gets these commands and we can respond to them with the tools from the `discordeno` library.

## Development

To get started please get the traditional environment variables from the [Discord dev portal](https://discord.com/developers/). Create an application there and extract the following info:
- DISCORD_APPLICATION_ID - the application ID you can find right under `General Information`
- DISCORD_PUBLIC_KEY - it's right under the application ID
- DISCORD_BOT_TOKEN - go to the `Bot` tab and `Reset token` to generate a new one. Remember that tokens cannot be re-read again so you have to reset it each time you lose said token.
- DEVELOPMENT - set this to `true` locally so we correctly load variables from the `.env` file instead of the actual shell environment

You can `cp .env.sample .env` to get a formatted `.env` file.

During dev, we run a traditional bot setup via the `startBot` function. It connects via Websockets to the Discord API so we don't need to play around with HTTP tunnels. During development, we log received commands and also their associated `options`. Please get familiar with the [Command API](https://discord.com/developers/docs/interactions/application-commands) before you start playing around with this template!

When all of this is done, you can run the following commands to start hacking away:
```
deno task dev
```

## Production

This template is ready to go on [Deno Deploy](https://deno.com/deploy). Just make sure you set the environment variables correctly, except for the `DEVELOPMENT`, which should not be set on production.

Create **another application** as you did for development. Remember: **you should use different credentials for production or development**. Then, make sure you set `Interactions Endpoint URL` to the URL of your `Deno Deploy` project.

Your Discord bot should start forwarding said commands to said URL.

## Handle new Discord commands

You need to register Discord commands before you use them. That's why we created two default tasks that you can run either in development or production.

```
deno task run tasks/delete_commands_task.ts

// and

deno task run tasks/upsert_commands_task.ts
```

Both these tasks can be run manually or in CI. For development, it's ok to `delete` and `upsert` at any time, but for `production` we prefer to do it on CI. This template is already configured to do this on GitHub Actions. Just make sure you also set your Github Actions environment variables ([good tutorial here](https://snyk.io/blog/how-to-use-github-actions-environment-variables/) with the necessary Discord stuff.

The `delete` task just removes all commands registered by your bot. The `upsert` creates the new commands, and updates existing ones (for example, if you just changed their arguments).

## What about the coding part?

Well, the parts of this template that you should play with really is the `src/commands` folder. The rest is just boilerplate but feel free to tweak it.

We have two example commands `ping.ts` and `hello.ts`. The first with no arguments and the second with a single argument.

Here is the `ping` command for example:
```typescript
import { ApplicationCommandTypes, InteractionResponseTypes } from "discord";
import { buildCommand } from "@/commands/utils.ts";

const PING_COMMAND = buildCommand({
  name: "ping",
  description: "Pings you back!",
  type: ApplicationCommandTypes.ChatInput,
  handler: () => {
    return {
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: { content: "Pong!" },
    };
  },
});

export default PING_COMMAND;
```

Here we define the `name` and `description` of the command, which are mandatory. Same thing as the `type` (check the Discord Commands API for more info!!!). Finally, we define the `handler` of the command. The command interface is fully typed and inherits its behavior from the `CreateApplicationCommand` type from `discordeno` (which is mainly stuff from, again, the Discord Commands API).

The response of the `handler` is an interaction, which is a reply that the bot will send to the caller of the command. Essentially, you just put the message on `data.content` but the API has more stuff you can do with it. This is not part of the template, it's just stuff from Discord and you should explore that on your own.

One thing this template does is to help you type arguments.

```typescript
import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  Interaction,
  InteractionResponseTypes,
} from "discord";
import { z } from "zod";
import { buildCommand, getOptionValue } from "@/commands/utils.ts";

const HELLO_COMMAND = buildCommand({
  name: "hello",
  description: "Says hello to any user!",
  options: [
    {
      name: "user",
      description: "The user",
      type: ApplicationCommandOptionTypes.User,
      required: true,
    },
  ],
  type: ApplicationCommandTypes.ChatInput,
  buildArguments: (interaction: Interaction) => {
    const schema = z.object({ userId: z.string() });

    return schema.parse({
      userId: getOptionValue<string>(interaction, "user"),
    });
  },
  handler: ({ userId }) => {
    return {
      type: InteractionResponseTypes.ChannelMessageWithSource,
      data: { content: `Hello, <@${userId}>!` },
    };
  },
});

export default HELLO_COMMAND;
```

We offer you the `buildArguments` function that also defines the argument type of `handler`. You can also validate the parameters with something like `zod`. Also, our `getOptionValue` utility just lets you extract the value or any argument you desire.

To add new commands just create new files under `src/commands` and make sure you export the command as the `default` export.

## Testing

As we are separating the logic of parsing command arguments, we can individually just test our commands through the `handler`. Check the `hello_test.ts` and `ping_test.ts` examples under `test/commands`.

Working on tests for `buildArguments` though.

## TODO

- Autoload of some sort. Right now we need to create new files for commands, which is fine, but we also need to add them to `src/commands.ts`. Would be great to just auto-load all files under `src/commands`. We are blocked by Deno Deploy not supporting async imports right now.
- Integrated command options parsing and validation. Ideally we could immediatly translate the `options` array of a command into a `zod` schema and have true end to end type safety
- Easy way to test `handleInteraction` with some true Discord payloads so we can also test options parsing
