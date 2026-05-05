import "dotenv/config";
import { createClient } from "./bot/client";
import { setupBot } from "./bot/setup";

const client = createClient();
await setupBot(client);

const token = process.env["DISCORD_TOKEN"];
if (!token) throw new Error("DISCORD_TOKEN is not set");
client.login(token);
