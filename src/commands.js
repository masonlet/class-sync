const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const chrono = require('chrono-node');
const { loadDeadlines, saveDeadlines } = require('./storage');
const { resolveChannel, isForumChannel, isTextChannel } = require('./channels');
const { getOrCreateReminderLocation } = require('./reminders');

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
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('cohort')
        .setDescription('Cohort role (e.g., @class-a)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('assignment')
        .setDescription('Assignment name')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('date')
        .setDescription('Due date (e.g., "12/22/25 11:59 PM", "Dec 22 at 11:59pm")')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('remove-deadline')
    .setDescription('Remove a course deadline')
    .addStringOption(option =>
      option.setName('course')
        .setDescription('Course name, code, channel, or forum.')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('cohort')
        .setDescription('Cohort role (e.g., @class-a)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('assignment')
        .setDescription('Assignment name')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('list-deadlines')
    .setDescription('List all stored deadlines')
    .addStringOption(option =>
      option.setName('course')
        .setDescription('Filter by course (optional)')
        .setRequired(false)
    )
    .addRoleOption(option =>
      option.setName('cohort')
        .setDescription('Filter by cohort (optional)')
        .setRequired(false)
    )
].map(command => command.toJSON());

async function handleCommand(interaction) {
  if(interaction.commandName === 'status') {
    await interaction.reply('Bot is working');
  }

  if(interaction.commandName === 'add-deadline') {
    if(!hasPermission(interaction)) {
      await interaction.reply({
        content: `You need the ${process.env.HELPER_ROLE_NAME} role or Administrator permissions to use this command.`, 
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const courseInput = interaction.options.getString('course');
    const channel = resolveChannel(interaction.guild, courseInput);

    if (channel === "DUPLICATE") {
      await interaction.reply({
        content: `⚠️ Multiple channels match "**${courseInput}**". Please be more specific (e.g., use the full name or mention the channel with #).`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    if (!channel) {
      await interaction.reply({
        content: 'Could not find a channel matching that course identifier.', 
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const cohort = interaction.options.getRole('cohort');
    const assignment = interaction.options.getString('assignment');
    const dateInput = interaction.options.getString('date');
    const parsedDate = chrono.parseDate(dateInput);

    if(!parsedDate){
      await interaction.reply({
        content: 'Invalid date format.', 
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const reminderLocationId = await getOrCreateReminderLocation(
      interaction.guild,
      channel,
      cohort.name
    );

    if (!reminderLocationId) {
      await interaction.reply({
        content: 'Could not create reminder location. The bot may be missing "Manage Channels" permission.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const deadlines = loadDeadlines();
    const newDeadline = {
      id: Date.now().toString(),
      courseChannelId: channel.id,
      courseChannelName: channel.name,
      cohortId: cohort.id,
      cohortName: cohort.name,
      assignment: assignment,
      dueDate: parsedDate.toISOString(),
      createdAt: new Date().toISOString(),
      reminderLocationId: reminderLocationId
    }

    deadlines.push(newDeadline);
    saveDeadlines(deadlines);

    await interaction.reply(`Deadline added: ${assignment} for ${channel.name} (${cohort.name}) due ${parsedDate.toLocaleString()}`);
  }

  if(interaction.commandName === 'remove-deadline') {
    if(!hasPermission(interaction)) {
      await interaction.reply({
        content: `You need the ${process.env.HELPER_ROLE_NAME} role or Administrator permissions to use this command.`, 
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const courseInput = interaction.options.getString('course');
    const channel = resolveChannel(interaction.guild, courseInput);

    if (channel === "DUPLICATE") {
      await interaction.reply({
        content: `⚠️ Multiple channels match "**${courseInput}**". Please be more specific (e.g., use the full name or mention the channel with #).`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    if (!channel) {
      await interaction.reply({
        content: 'Could not find a channel matching that course identifier.', 
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const cohort = interaction.options.getRole('cohort');
    const assignment = interaction.options.getString('assignment');

    const deadlines = loadDeadlines();
    const filteredDeadlines = deadlines.filter(d => 
      !(d.courseChannelId === channel.id && 
        d.cohortId === cohort.id && 
        d.assignment === assignment)
    );

    if (deadlines.length === filteredDeadlines.length) {
      await interaction.reply({
        content: 'No matching deadline found.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    saveDeadlines(filteredDeadlines);
    await interaction.reply(`Deadline removed: ${assignment} for ${channel.name} (${cohort.name})`);
  }

  if(interaction.commandName === 'list-deadlines') {
    const courseFilter = interaction.options.getString('course');
    const cohortFilter = interaction.options.getRole('cohort');

    let deadlines = loadDeadlines();

    if(courseFilter) {
      const channel = resolveChannel(interaction.guild, courseFilter);
      if (channel === "DUPLICATE") {
        await interaction.reply({
          content: "Multiple channels match your filter. Please be more specific.",
          flags: MessageFlags.Ephemeral
        });
        return;
      }
      if (channel) {
        deadlines = deadlines.filter(d => d.courseChannelId === channel.id);
      }
    }
    if(cohortFilter) {
      deadlines = deadlines.filter(d => d.cohortId === cohortFilter.id);
    }

    if(deadlines.length === 0) {
      await interaction.reply('No deadlines found.');
      return;
    }

    const response = deadlines.map(d =>
      `**${d.assignment}** - ${d.courseChannelName} (${d.cohortName}) - Due: ${new Date(d.dueDate).toLocaleString()}`
    ).join('\n');

    await interaction.reply(`**Stored Deadlines:**\n${response}`);
  }
}

module.exports = { commands, handleCommand };
