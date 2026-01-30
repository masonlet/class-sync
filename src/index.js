import "dotenv/config";
import { createClient } from './bot/client.js';
import { setupBot } from './bot/setup.js';

const client = createClient();
await setupBot(client);

client.login(process.env.DISCORD_TOKEN);
