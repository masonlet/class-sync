import { SlashCommandBuilder } from 'discord.js';
import { loadDeadlines } from '../storage/deadlineStorage.js';
import { resolveChannel } from '../services/channels.js';
import { deferEphemeral, replyEphemeral } from '../utils/interactions.js';
import { fromISO, discordTimestamp } from '../utils/time.js';
import { validateChannelFilter, checkRateLimit } from '../utils/commandHelpers.js';
import { getActiveDeadlines } from '../utils/expiration.js';

export const name = 'list-deadlines';

export const data = new SlashCommandBuilder()
  .setName('list-deadlines')
  .setDescription('List all stored deadlines')
  .addStringOption(option => option.setName('course')
    .setDescription('Filter by course (optional)')
    .setRequired(false)
  )
  .addRoleOption(option => option.setName('cohort')
    .setDescription('Filter by cohort (optional)')
    .setRequired(false)
  )
  .toJSON();

export async function handle(interaction) {
  await deferEphemeral(interaction);

  const rateLimitValid = await checkRateLimit(interaction);
  if (!rateLimitValid) return;

  const courseFilter = interaction.options.getString('course');
  const cohortFilter = interaction.options.getRole('cohort');

  let deadlines = loadDeadlines(interaction.guildId);

  deadlines = getActiveDeadlines(deadlines);

  if (courseFilter) {
    const channel = resolveChannel(interaction.guild, courseFilter);

    const channelValidation = validateChannelFilter(channel);
    if (!channelValidation.valid)
      return replyEphemeral(interaction, channelValidation.error);

    if (channel)
      deadlines = deadlines.filter(d => d.courseChannelId === channel.id);
  }

  if (cohortFilter)
    deadlines = deadlines.filter(d => d.cohortId === cohortFilter.id);

  if (deadlines.length === 0)
    return replyEphemeral(interaction, 'No deadlines found.');

  const response = deadlines.map(d => `**${d.assignment}** - ${d.courseChannelName} (${d.cohortName}) - Due: ${discordTimestamp(fromISO(d.dueDate))}`
  ).join('\n');

  return replyEphemeral(interaction, `**Stored Deadlines:**\n${response}`);
}
