import { loadDeadlines } from '../storage/deadlineStorage.js';
import { loadMessages, saveMessages } from '../storage/messageStorage.js';
import { fromISO, discordTimestamp } from '../utils/time.js';
import { getActiveDeadlines } from '../utils/expiration.js';

function sortDeadlinesByDate(deadlines) {
  return deadlines.sort((a, b) => fromISO(a.dueDate) - fromISO(b.dueDate));
}

function formatDeadlineItem(deadline) {
  const dueDate = fromISO(deadline.dueDate);
  return `- **${deadline.assignment}** - ${deadline.courseChannelName} - Due: ${discordTimestamp(dueDate)} (${discordTimestamp(dueDate, 'R')})`;
}

function buildDeadlineContent(deadlines) {
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
  channel,
  content,
  guildId,
  messages,
  reminderLocationId
) {
  const newMessage = await channel.send(content);
  await newMessage.pin();
  messages[reminderLocationId] = newMessage.id;
  saveMessages(guildId, messages);
}

async function updateOrCreateMessage(
  channel,
  content,
  guildId,
  messages,
  reminderLocationId
) {
  const existingMessageId = messages[reminderLocationId];

  if (existingMessageId) {
    try {
      const message = await channel.messages.fetch(existingMessageId);
      await message.edit(content);
    } catch (error) {
      await createAndPinMessage(channel, content, guildId, messages, reminderLocationId);
    }
  } else {
    await createAndPinMessage(channel, content, guildId, messages, reminderLocationId);
  }
}

export async function updateDeadlineMessage(
  guild,
  reminderLocationId
) {
  try {
    const channel = await guild.channels.fetch(reminderLocationId);
    if (!channel) {
      console.error('Could not find reminder location channel');
      return false;
    }

    const guildId = guild.id;
    const messages = loadMessages(guildId);

    const locationDeadlines = loadDeadlines(guildId).filter(d => d.reminderLocationId === reminderLocationId);
    const deadlines = getActiveDeadlines(locationDeadlines);
    
    let content = buildDeadlineContent(deadlines);

    await updateOrCreateMessage(channel, content, guildId, messages, reminderLocationId);

    return true;
  } catch (error) {
    console.error('Failed to update deadline message:', error.message);
    return false;
  }
}
