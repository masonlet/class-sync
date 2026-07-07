import { Guild, type GuildTextBasedChannel } from "discord.js";
import type { Deadline                                    } from "../types.js";
import { loadDeadlines                                    } from "../storage/deadlineStorage.js";
import { loadMessages, saveMessages, type MessageTracking } from "../storage/messageStorage.js";
import { fromISO, discordTimestamp                        } from "../utils/time.js";
import { getActiveDeadlines                               } from "../utils/expiration.js";

function sortDeadlinesByDate(deadlines: Deadline[]): Deadline[] {
  return deadlines.sort(
    (a, b) => fromISO(a.dueDate).getTime() - fromISO(b.dueDate).getTime()
  );
}

function formatDeadlineItem(deadline: Deadline): string {
  const dueDate = fromISO(deadline.dueDate);
  return `- **${deadline.assignment}** - ${deadline.courseChannelName} - Due: ${discordTimestamp(dueDate)} (${discordTimestamp(dueDate, 'R')})`;
}

function buildDeadlineContent(deadlines: Deadline[]): string {
  let content = '**Upcoming Deadlines:**\n\n';

  if (deadlines.length === 0) {
    content += 'No deadlines.';
  } else {
    const sorted = sortDeadlinesByDate(deadlines);
    content += sorted.map(formatDeadlineItem).join('\n');
  }

  return content;
}

async function createAndPinMessage(
  channel: GuildTextBasedChannel,
  content: string,
  guildId: string,
  messages: MessageTracking,
  reminderLocationId: string
): Promise<void> {
  const newMessage = await channel.send(content);
  await newMessage.pin();
  messages[reminderLocationId] = newMessage.id;
  saveMessages(guildId, messages);
}

async function updateOrCreateMessage(
  channel: GuildTextBasedChannel,
  content: string,
  guildId: string,
  messages: MessageTracking,
  reminderLocationId: string
): Promise<void> {
  const existingMessageId = messages[reminderLocationId];

  if (existingMessageId) {
    try {
      const message = await channel.messages.fetch(existingMessageId);
      await message.edit(content);
    } catch (_) {
      await createAndPinMessage(channel, content, guildId, messages, reminderLocationId);
    }
  } else {
    await createAndPinMessage(channel, content, guildId, messages, reminderLocationId);
  }
}

export async function updateDeadlineMessage(
  guild: Guild,
  reminderLocationId: string
): Promise<boolean> {
  try {
    const channel = await guild.channels.fetch(reminderLocationId);
    if (!channel || !channel.isTextBased()) {
      console.error('Could not find reminder location channel');
      return false;
    }

    const guildId = guild.id;
    const messages = loadMessages(guildId);

    const locationDeadlines = loadDeadlines(guildId).filter(
      d => d.reminderLocationId === reminderLocationId
    );
    const deadlines = getActiveDeadlines(locationDeadlines);
    
    let content = buildDeadlineContent(deadlines);

    await updateOrCreateMessage(channel, content, guildId, messages, reminderLocationId);

    return true;
  } catch (e) {
    console.error('Failed to update deadline message:', e);
    return false;
  }
}
