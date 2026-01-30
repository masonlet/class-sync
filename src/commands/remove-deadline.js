import { SlashCommandBuilder } from 'discord.js';
import { loadDeadlines, saveDeadlines } from '../storage/deadlineStorage.js';
import { resolveChannel } from '../services/channels.js';
import { updateDeadlineMessage } from '../services/reminderMessage.js';
import { hasPermission, denyPermission } from '../utils/permissions.js';
import { deferEphemeral, replyEphemeral } from '../utils/interactions.js';
import { checkRateLimit } from '../utils/commandHelpers.js';

export const name = 'remove-deadline';

export const data = new SlashCommandBuilder()
  .setName('remove-deadline')
  .setDescription('Remove a course deadline')
  .addStringOption(option => option.setName('course')
    .setDescription('Course name, code, channel, or forum.')
    .setRequired(true)
  )
  .addRoleOption(option => option.setName('cohort')
    .setDescription('Cohort role (e.g., @class-a)')
    .setRequired(true)
  )
  .addStringOption(option => option.setName('assignment')
    .setDescription('Assignment name')
    .setRequired(true)
  )
  .toJSON();
  
export async function handle(interaction) {
  await deferEphemeral(interaction);

  const rateLimitValid = await checkRateLimit(interaction);
  if (!rateLimitValid) return;

  if (!hasPermission(interaction))
    return denyPermission(interaction);

  const course = interaction.options.getString('course');
  const channel = resolveChannel(interaction.guild, course);
  if (!channel || channel === "DUPLICATE")
    return replyEphemeral(interaction, channel === "DUPLICATE" ? "Multiple channels found." : "Channel not found.");

  const cohort = interaction.options.getRole('cohort');
  const assignment = interaction.options.getString('assignment');

  const deadlines = loadDeadlines(interaction.guildId);
  const deadline = deadlines.find(d => d.courseChannelId === channel.id &&
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
