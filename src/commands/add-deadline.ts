import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { parseDate                                        } from "chrono-node";
import type { Deadline                                        } from "../types.js";
import { loadDeadlines, saveDeadlines                         } from "../storage/deadlineStorage.js";
import { resolveChannel                                       } from "../services/channels.js";
import { getOrCreateReminderLocation                          } from "../services/reminderLocation.js";
import { updateDeadlineMessage                                } from "../services/reminderMessage.js";
import { extractCommandInputs, isValidChannel, checkRateLimit } from "../utils/commandHelpers.js";
import { hasPermission, denyPermission                        } from "../utils/permissions.js";
import { deferEphemeral, replyEphemeral                       } from "../utils/interactions.js";
import { now, toISO, discordTimestamp                         } from "../utils/time.js";
import { validateDeadlineTime                                 } from "../utils/validation.js";

export const name = "add-deadline";

export const data = new SlashCommandBuilder()
  .setName("add-deadline")
  .setDescription("Add a course deadline")
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
  .addStringOption(option => option.setName("date")
    .setDescription(`Due date (e.g., "12/22/25 11:59 PM", "Dec 22 at 11:59pm")`)
    .setRequired(true)
  )
  .toJSON();

export async function handle(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await deferEphemeral(interaction);

  if (!hasPermission(interaction)) return denyPermission(interaction);
  if (!interaction.inCachedGuild()) return replyEphemeral(interaction, "This command must be used in a server.");

  const rateLimitValid = await checkRateLimit(interaction);
  if (!rateLimitValid) return;

  const { course, cohort, assignment, date } = extractCommandInputs(interaction);

  const channel = resolveChannel(interaction.guild, course);
  if (!isValidChannel(channel)) return replyEphemeral(
    interaction, channel === "DUPLICATE" ? "Multiple channels found." : "Channel not found."
  );

  const parsedDate = parseDate(date);
  if (!parsedDate) return replyEphemeral(interaction, "Invalid date format.");

  const validation = validateDeadlineTime(parsedDate);
  if (!validation.valid) return replyEphemeral(interaction, validation.error);

  const reminderLocationId = await getOrCreateReminderLocation(
    interaction.guild,
    channel,
    cohort.name
  );

  if (!reminderLocationId) return replyEphemeral(
    interaction,
    `Could not create reminder location. The bot may be missing "Manage Channels" permission.`
  );

  const deadlines: Deadline[] = loadDeadlines(interaction.guildId);
  if (deadlines.some(
    d => d.courseChannelId === channel.id
      && d.cohortId === cohort.id
      && d.assignment === assignment
  )) return replyEphemeral(
    interaction,
    `This deadline already exists. Use /remove-deadline first if you want to update it.`
  );

  const newDeadline: Deadline = {
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
      "24h": false,
      "8h": false,
      "1h": false
    }
  };

  deadlines.push(newDeadline);
  saveDeadlines(interaction.guildId, deadlines);
  await updateDeadlineMessage(interaction.guild, reminderLocationId);

  return replyEphemeral(
    interaction,
    `Deadline added: ${assignment} for ${channel.name} (${cohort.name}) due ${discordTimestamp(parsedDate)}`
  );
}
