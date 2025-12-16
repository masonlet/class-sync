require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const chrono = require('chrono-node');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const commands = [
  new SlashCommandBuilder() 
    .setName('status')
    .setDescription('Check if bot is working'),
  new SlashCommandBuilder()
    .setName('add-deadline')
    .setDescription('Add a course deadline')
    .addStringOption(option =>
      option.setName('course')
        .setDescription('Course name, code, channel, or forum.')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('cohort')
        .setDescription('Cohort role (e.g., @class-a)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('assignment')
        .setDescription('Assignment name')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('date')
        .setDescription('Due date (e.g., "12/22/25 11:59 PM", "Dec 22 at 11:59pm")')
        .setRequired(true))
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

  if(interaction.commandName === 'add-deadline') {
    if(!hasPermission(interaction)) {
      await interaction.reply({content: `You need the ${process.env.HELPER_ROLE_NAME} role or Administrator permissions to use this command.`, ephemeral: true});
      return;
    }

    const course = interaction.options.getString('course');
    const cohort = interaction.options.getRole('cohort');
    const assignment = interaction.options.getString('assignment');
    const dateInput = interaction.options.getString('date');

    const parsedDate = chrono.parseDate(dateInput);
    if(!parsedDate){
      await interaction.reply({content: 'Invalid date format.', ephemeral: true});
      return;
    }

    await interaction.reply(`Deadline added: ${assignment} for ${course} (${cohort.name}) due ${parsedDate.toLocaleString()}`);
  }
});


client.login(process.env.DISCORD_TOKEN);
  
