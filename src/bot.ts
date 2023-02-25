import { createBot } from "discord";
import config from "@/config.ts";

const bot = createBot({
  token: config.DISCORD_BOT_TOKEN,
  applicationId: config.DISCORD_APPLICATION_ID,
});

export default bot;
