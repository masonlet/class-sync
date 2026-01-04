const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const chrono = require('chrono-node');
const { loadDeadlines, saveDeadlines } = require('../deadlineStorage');
const { resolveChannel } = require('../channels');
const { getOrCreateReminderLocation, updateDeadlineMessage } = require('../reminders');
const { hasPermission, denyPermission } = require('../utils/commandHelpers');

module.exports = {
  name: 'add-deadline',
  data: new SlashCommandBuilder()
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
    )
    .toJSON(),

  async handle(interaction) {
    if(!hasPermission(interaction)) return denyPermission(interaction);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const courseInput = interaction.options.getString('course');
    const channel = resolveChannel(interaction.guild, courseInput);
    if (!channel || channel === "DUPLICATE") {
      const msg = channel === "DUPLICATE" ? "Multiple channels found." : "Channel not found.";
      return interaction.editReply({ content: msg });
    }
    
    const cohort = interaction.options.getRole('cohort');
    const assignment = interaction.options.getString('assignment');
    const dateInput = interaction.options.getString('date');
    const parsedDate = chrono.parseDate(dateInput);

    if (!parsedDate) { 
      return interaction.editReply({
        content: 'Invalid date format.'
      });
    }

    const reminderLocationId = await getOrCreateReminderLocation(
      interaction.guild,
      channel,
      cohort.name
    );

    if (!reminderLocationId) {
      return interaction.editReply({
        content: 'Could not create reminder location. The bot may be missing "Manage Channels" permission.'
      });
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

    await updateDeadlineMessage(interaction.guild, reminderLocationId);
    await interaction.editReply(`Deadline added: ${assignment} for ${channel.name} (${cohort.name}) due ${parsedDate.toLocaleString()}`);

  }
}
