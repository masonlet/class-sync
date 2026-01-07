const { SlashCommandBuilder } = require('discord.js');
const { loadDeadlines } = require('../storage/deadlineStorage');
const { resolveChannel } = require('../services/channels');
const { deferEphemeral, replyEphemeral } = require('../utils/interactions');
const { fromISO, discordTimestamp } = require('../utils/time');
const { validateChannelFilter } = require('../utils/commandHelpers');

module.exports = {
  name: 'list-deadlines',
  data: new SlashCommandBuilder()
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
    .toJSON(),

  async handle(interaction) {
    await deferEphemeral(interaction);    

    const courseFilter = interaction.options.getString('course');
    const cohortFilter = interaction.options.getRole('cohort');

    let deadlines = loadDeadlines();

    if(courseFilter) {
      const channel = resolveChannel(interaction.guild, courseFilter);

      const channelValidation = validateChannelFilter(channel);
      if(!channelValidation.valid) 
        return replyEphemeral(interaction, channelValidation.error);

      if (channel)
        deadlines = deadlines.filter(d => d.courseChannelId === channel.id);
    }

    if(cohortFilter) 
      deadlines = deadlines.filter(d => d.cohortId === cohortFilter.id);

    if(deadlines.length === 0) 
      return replyEphemeral(interaction, 'No deadlines found.');

    const response = deadlines.map(d =>
      `**${d.assignment}** - ${d.courseChannelName} (${d.cohortName}) - Due: ${discordTimestamp(fromISO(d.dueDate))}`
    ).join('\n');

    return replyEphemeral(interaction, `**Stored Deadlines:**\n${response}`);
  }
};
