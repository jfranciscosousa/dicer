import { createBot } from "discord";
import config from "@/config.ts";

const bot = createBot({
  token: config.DISCORD_BOT_TOKEN,
  applicationId: config.DISCORD_APPLICATION_ID,
  desiredProperties: {
    interaction: {
      id: true,
      type: true,
      token: true,
      data: true,
      user: true,
      member: true,
      applicationId: true,
      guild: true,
      channel: true,
      version: true,
      appPermissions: true,
      authorizingIntegrationOwners: true,
    },
    interactionDataOptions: {
      name: true,
      value: true,
      type: true,
      options: true,
    },
    user: {
      id: true,
      username: true,
    },
    member: {
      user: true,
    },
  },
});

export default bot;
