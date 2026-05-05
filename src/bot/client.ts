import { Client, GatewayIntentBits, Collection } from "discord.js";

export function createClient(): Client {
  const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
  });

  client.commands = new Collection();
  return client;
}
