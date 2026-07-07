import { Client, GatewayIntentBits, Collection } from "discord.js";
import { setupBot                              } from "../bot/setup.js";

export async function createClient(): Promise<Client> {
  const client    = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.commands = new Collection();

  await setupBot(client);
  return client;
}
