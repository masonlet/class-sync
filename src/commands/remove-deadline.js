const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { loadDeadlines, saveDeadlines } = require('../deadlineStorage');
const { resolveChannel } = require('../channels');
const { updateDeadlineMessage } = require('../reminders');
const { hasPermission, denyPermission } = require('../utils/commandHelpers');

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

    const deadlines = loadDeadlines();
    const deadline = deadlines.find(d =>
      d.courseChannelId === channel.id &&
      d.cohortId === cohort.id &&
      d.assignment === assignment
    );

    if (!deadline) return interaction.editReply({ content: 'No matching deadline found.' });

    const filteredDeadlines = deadlines.filter(d => d.id !== deadline.id);
    saveDeadlines(filteredDeadlines);

    await updateDeadlineMessage(interaction.guild, deadline.reminderLocationId);
    await interaction.editReply(`Deadline removed: ${assignment} for ${channel.name} (${cohort.name})`);
  }
}
