const { SlashCommandBuilder } = require('discord.js');
const chrono = require('chrono-node');
const { loadDeadlines, saveDeadlines } = require('../storage/deadlineStorage');
const { resolveChannel } = require('../services/channels');
const { getOrCreateReminderLocation } = require('../services/reminderLocation');
const { updateDeadlineMessage } = require('../services/reminderMessage');
const { 
  extractCommandInputs, 
  validateChannelResolution,
  checkRateLimit
} = require('../utils/commandHelpers');
const { hasPermission, denyPermission } = require('../utils/permissions');
const { deferEphemeral, replyEphemeral } = require('../utils/interactions');
const { now, toISO, discordTimestamp } = require('../utils/time');
const { validateDeadlineTime } = require('../utils/validation');

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

    const rateLimitValid = await checkRateLimit(interaction);
    if (!rateLimitValid) return;

    if(!hasPermission(interaction)) 
      return denyPermission(interaction);

    const { course, cohort, assignment, date } = extractCommandInputs(interaction);

    const channel = resolveChannel(interaction.guild, course);
    const channelValidation = validateChannelResolution(channel);
    if (!channelValidation.valid)
      return replyEphemeral(interaction, channelValidation.error);

    const parsedDate = chrono.parseDate(date);
    if (!parsedDate) 
      return replyEphemeral(interaction, 'Invalid date format.');

    const validation = validateDeadlineTime(parsedDate);
    if (!validation.valid)
      return replyEphemeral(interaction, validation.error);

    const reminderLocationId = await getOrCreateReminderLocation(
      interaction.guild,
      channel,
      cohort.name
    );

    if (!reminderLocationId) 
      return replyEphemeral(interaction, 'Could not create reminder location. The bot may be missing "Manage Channels" permission.');

    const deadlines = loadDeadlines(interaction.guildId);
    
    const duplicate = deadlines.find(d =>
      d.courseChannelId === channel.id &&
      d.cohortId === cohort.id &&
      d.assignment === assignment
    );

    if (duplicate)
      return replyEphemeral(
        interaction,
        `This deadline already exists. Use /remove-deadline first if you want to update it.`
      );

    const newDeadline = {
      id: String(now().getTime()),
      courseChannelId: channel.id,
      courseChannelName: channel.name,
      cohortId: cohort.id,
      cohortName: cohort.name,
      assignment,
      dueDate: toISO(parsedDate),
      createdAt: toISO(now()),
      reminderLocationId,
      remindersSent: {
        '24h': false,
        '8h': false,
        '1h': false
      }
    }

    deadlines.push(newDeadline);
    saveDeadlines(interaction.guildId, deadlines);
    await updateDeadlineMessage(interaction.guild, reminderLocationId);

    return replyEphemeral(interaction, `Deadline added: ${assignment} for ${channel.name} (${cohort.name}) due ${discordTimestamp(parsedDate)}`);
  }
}
