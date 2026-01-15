const { SlashCommandBuilder } = require('discord.js');
const { loadDeadlines, saveDeadlines } = require('../storage/deadlineStorage');
const { resolveChannel } = require('../services/channels');
const { updateDeadlineMessage } = require('../services/reminderMessage');
const { hasPermission, denyPermission } = require('../utils/permissions');
const { deferEphemeral, replyEphemeral } = require('../utils/interactions');

module.exports = {
  name: 'remove-deadline',
  data: new SlashCommandBuilder()
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
    )
    .toJSON(),

  async handle(interaction) {
    await deferEphemeral(interaction); 

    if(!hasPermission(interaction)) 
      return denyPermission(interaction);

    const course = interaction.options.getString('course');
    const channel = resolveChannel(interaction.guild, course);
    if (!channel || channel === "DUPLICATE") 
      return replyEphemeral(interaction, channel === "DUPLICATE" ? "Multiple channels found." : "Channel not found.");

    const cohort = interaction.options.getRole('cohort');
    const assignment = interaction.options.getString('assignment');

    const deadlines = loadDeadlines(interaction.guildId);
    const deadline = deadlines.find(d =>
      d.courseChannelId === channel.id &&
      d.cohortId === cohort.id &&
      d.assignment === assignment
    );

    if (!deadline)  
      return replyEphemeral(interaction, 'No matching deadline found.');

    const filteredDeadlines = deadlines.filter(d => d.id !== deadline.id);
    saveDeadlines(interaction.guildId, filteredDeadlines);

    await updateDeadlineMessage(interaction.guild, deadline.reminderLocationId);
    return replyEphemeral(interaction, `Deadline removed: ${assignment} for ${channel.name} (${cohort.name})`);
  }
}
