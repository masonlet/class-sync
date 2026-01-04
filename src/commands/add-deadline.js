const { SlashCommandBuilder } = require('discord.js');
const chrono = require('chrono-node');
const { loadDeadlines, saveDeadlines } = require('../storage/deadlineStorage');
const { resolveChannel } = require('../services/channels');
const { getOrCreateReminderLocation, updateDeadlineMessage } = require('../services/reminders');
const { hasPermission, denyPermission } = require('../utils/permissions');
const { deferEphemeral, replyEphemeral } = require('../utils/interactions');

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
    await deferEphemeral(interaction);

    if(!hasPermission(interaction)) 
      return denyPermission(interaction);

    const courseInput = interaction.options.getString('course');
    const channel = resolveChannel(interaction.guild, courseInput);
    if (!channel || channel === "DUPLICATE") 
      return replyEphemeral(interaction, channel === "DUPLICATE" ? "Multiple channels found." : "Channel not found.");
    
    const cohort = interaction.options.getRole('cohort');
    const assignment = interaction.options.getString('assignment');
    const dateInput = interaction.options.getString('date');
    const parsedDate = chrono.parseDate(dateInput);

    if (!parsedDate) 
      return replyEphemeral(interaction, 'Invalid date format.');

    const reminderLocationId = await getOrCreateReminderLocation(
      interaction.guild,
      channel,
      cohort.name
    );

    if (!reminderLocationId) 
      return replyEphemeral(interaction, 'Could not create reminder location. The bot may be missing "Manage Channels" permission.');

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

    return replyEphemeral(interaction, `Deadline added: ${assignment} for ${channel.name} (${cohort.name}) due ${parsedDate.toLocaleString()}`);
  }
}
