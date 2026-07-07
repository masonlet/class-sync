import "dotenv/config";
import { createClient } from "./bot/client.js";

const token = process.env["DISCORD_TOKEN"];
if (!token) throw new Error("DISCORD_TOKEN is not set");

const client = await createClient();
client.login(token);
