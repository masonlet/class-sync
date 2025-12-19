require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { commands, handleCommand } = require('./commands');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const rest = new REST({version: '10'}).setToken(process.env.DISCORD_TOKEN);

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    console.log('Registering slash commands');

    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID)
      : Routes.applicationCommands(client.user.id);
    await rest.put(route, { body: commands });
  } catch (error) {
    console.error('Error registering commands: ', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  await handleCommand(interaction);
});

client.login(process.env.DISCORD_TOKEN);
