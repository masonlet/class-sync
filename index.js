require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const commands = [
  new SlashCommandBuilder() 
    .setName('status')
    .setDescription('Check if bot is working')
].map(command => command.toJSON());

const rest = new REST({version: '10'}).setToken(process.env.DISCORD_TOKEN);

function hasPermission(interaction) {
  const hasHelper = interaction.member.roles.cache.some(role => role.name === process.env.HELPER_ROLE_NAME);
  const hasAdmin = interaction.member.permissions.has('Administrator');
  return hasHelper || hasAdmin;
}

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

  if(interaction.commandName === 'status') {
    await interaction.reply('Bot is working');
  }
});


client.login(process.env.DISCORD_TOKEN);
  
