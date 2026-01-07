const { SlashCommandBuilder } = require('discord.js');
const { loadDeadlines } = require('../storage/deadlineStorage');
const { resolveChannel } = require('../services/channels');
const { deferEphemeral, replyEphemeral } = require('../utils/interactions');
const { fromISO, discordTimestamp } = require('../utils/time');

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

      if (channel === "DUPLICATE")   
        return replyEphemeral(interaction, "Multiple channels match your filter. Please be more specific.");

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
