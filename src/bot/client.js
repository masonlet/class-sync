const { Client, GatewayIntentBits, Collection } = require('discord.js');

function createClient() {
  const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
  });

  client.commands = new Collection();
  return client;
}

module.exports = { createClient };
