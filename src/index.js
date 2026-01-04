require('dotenv').config();
const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
const { loadCommands, registerCommands } = require('./handlers/commandHandler');
const { setupInteractionHandler } = require('./handlers/eventHandler');


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
client.commands = new Collection();

const commandData = loadCommands(client);
setupInteractionHandler(client);

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    console.log('Registering slash commands');
    await registerCommands(client, commandData);
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

client.login(process.env.DISCORD_TOKEN);
