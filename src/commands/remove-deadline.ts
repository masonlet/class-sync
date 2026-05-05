import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

import { hasPermission, denyPermission } from "../utils/permissions";
import { deferEphemeral, replyEphemeral } from "../utils/interactions";
import { checkRateLimit } from "../utils/commandHelpers";
import { loadDeadlines, saveDeadlines } from "../storage/deadlineStorage";
import { updateDeadlineMessage } from "../services/reminderMessage";
import { resolveChannel } from "../services/channels";

export const name = "remove-deadline";

export const data = new SlashCommandBuilder()
  .setName("remove-deadline")
  .setDescription("Remove a course deadline")
  .addStringOption(option => option.setName("course")
    .setDescription("Course name, code, channel, or forum.")
    .setRequired(true)
  )
  .addRoleOption(option => option.setName("cohort")
    .setDescription("Cohort role (e.g., @class-a)")
    .setRequired(true)
  )
  .addStringOption(option => option.setName("assignment")
    .setDescription("Assignment name")
    .setRequired(true)
  )
  .toJSON();

export async function handle(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await deferEphemeral(interaction);

  const rateLimitValid = await checkRateLimit(interaction);
  if (!rateLimitValid) return;

  if (!hasPermission(interaction)) return denyPermission(interaction);

 if (!interaction.inCachedGuild())
   return replyEphemeral(interaction, "This command must be used in a server.");

  const course = interaction.options.getString("course", true);
  const channel = resolveChannel(interaction.guild, course);
  if (!channel || channel === "DUPLICATE")
    return replyEphemeral(interaction, channel === "DUPLICATE" ? "Multiple channels found." : "Channel not found.");

  const cohort = interaction.options.getRole("cohort", true);
  const assignment = interaction.options.getString("assignment", true);

  const deadlines = loadDeadlines(interaction.guildId);
  const deadline = deadlines.find(d => d.courseChannelId === channel.id &&
    d.cohortId === cohort.id &&
    d.assignment === assignment
  );

  if (!deadline) return replyEphemeral(interaction, "No matching deadline found.");

  const filteredDeadlines = deadlines.filter(d => d.id !== deadline.id);
  saveDeadlines(interaction.guildId, filteredDeadlines);

  await updateDeadlineMessage(interaction.guild, deadline.reminderLocationId);
  return replyEphemeral(interaction, `Deadline removed: ${assignment} for ${channel.name} (${cohort.name})`);
}
