const { SlashCommandBuilder } = require('discord.js');
const chrono = require('chrono-node');
const { loadDeadlines, saveDeadlines } = require('./storage');

function hasPermission(interaction) {
  const hasHelper = interaction.member.roles.cache.some(role => role.name === process.env.HELPER_ROLE_NAME);
  const hasAdmin = interaction.member.permissions.has('Administrator');
  return hasHelper || hasAdmin;
}

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
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('list-deadlines')
    .setDescription('List all stored deadlines')
    .addStringOption(option =>
      option.setName('course')
        .setDescription('Filter by course (optional)')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('cohort')
        .setDescription('Filter by cohort (optional)')
        .setRequired(false))
].map(command => command.toJSON());

async function handleCommand(interaction) {
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

    const deadlines = loadDeadlines();
    const newDeadline = {
      id: Date.now().toString(),
      course: course,
      cohortId: cohort.id,
      cohortName: cohort.name,
      assignment: assignment,
      dueDate: parsedDate.toISOString(),
      createdAt: new Date().toISOString()
    }

    deadlines.push(newDeadline);
    saveDeadlines(deadlines);

    await interaction.reply(`Deadline added: ${assignment} for ${course} (${cohort.name}) due ${parsedDate.toLocaleString()}`);
  }

  if(interaction.commandName === 'list-deadlines') {
    const courseFilter = interaction.options.getString('course');
    const cohortFilter = interaction.options.getRole('cohort');

    let deadlines = loadDeadlines();

    if(courseFilter) {
      deadlines = deadlines.filter(d => d.course.toLowerCase().includes(courseFilter.toLowerCase()));
    }
    if(cohortFilter) {
      deadlines = deadlines.filter(d => d.cohortId === cohortFilter.id);
    }

    if(deadlines.length === 0) {
      await interaction.reply('No deadlines found.');
      return;
    }

    const response = deadlines.map(d =>
      `**${d.assignment}** - ${d.course} (${d.cohortName}) - Due: ${new Date(d.dueDate).toLocaleString()}`
    ).join('\n');

    await interaction.reply(`**Stored Deadlines:**\n${response}`);
  }
}

module.exports = { commands, handleCommand };
