import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { loadDeadlines                        } from "../storage/deadlineStorage.js";
import { resolveChannel                       } from "../services/channels.js";
import { deferEphemeral, replyEphemeral       } from "../utils/interactions.js";
import { fromISO, discordTimestamp            } from "../utils/time.js";
import { isValidChannelFilter, checkRateLimit } from "../utils/commandHelpers.js";
import { getActiveDeadlines                   } from "../utils/expiration.js";

export const name = "list-deadlines";

export const data = new SlashCommandBuilder()
  .setName("list-deadlines")
  .setDescription("List all stored deadlines")
  .addStringOption(option => option.setName("course")
    .setDescription("Filter by course (optional)")
    .setRequired(false)
  )
  .addRoleOption(option => option.setName("cohort")
    .setDescription("Filter by cohort (optional)")
    .setRequired(false)
  )
  .toJSON();

export async function handle(interaction: ChatInputCommandInteraction): Promise<void> {
  await deferEphemeral(interaction);

  if (!interaction.inCachedGuild()) return replyEphemeral(interaction, "This command must be used in a server.");

  const rateLimitValid = await checkRateLimit(interaction);
  if (!rateLimitValid) return;

  let deadlines = loadDeadlines(interaction.guildId);
  deadlines = getActiveDeadlines(deadlines);

  const courseFilter = interaction.options.getString("course");
  if (courseFilter) {
    const channel = resolveChannel(interaction.guild, courseFilter);
    if (!isValidChannelFilter(channel))
      return replyEphemeral(interaction, "Multiple channels match your filter. Please be more specific.");

    if (channel) deadlines = deadlines.filter(d => d.courseChannelId === channel.id);
  }

  const cohortFilter = interaction.options.getRole("cohort");
  if (cohortFilter) deadlines = deadlines.filter(d => d.cohortId === cohortFilter.id);

  if (deadlines.length === 0) return replyEphemeral(interaction, "No deadlines found.");

  const response = deadlines.map(
    d => `**${d.assignment}** - ${d.courseChannelName} (${d.cohortName}) - Due: ${discordTimestamp(fromISO(d.dueDate))}`
  ).join("\n");

  return replyEphemeral(interaction, `**Stored Deadlines:**\n${response}`);
}
