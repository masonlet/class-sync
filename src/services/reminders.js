const { ChannelType } = require('discord.js');
const { isForumChannel, isTextChannel } = require('./channels');
const { loadDeadlines } = require('../storage/deadlineStorage');
const { loadMessages, saveMessages } = require('../storage/messageStorage');
const { fromISO, discordTimestamp } = require('../utils/time');

async function getOrCreateReminderLocation(guild, courseChannel, cohortName) {
  if (isForumChannel(courseChannel)) {
    const threads = await courseChannel.threads.fetchActive();
    let dueDatesThread = threads.threads.find(t => t.name === 'Due Dates');

    if (!dueDatesThread) {
      dueDatesThread = await courseChannel.threads.create({
        name: 'Due Dates',
        message: { content: '**Upcoming Deadlines:**\n\nNo deadlines.' }
      });

      const messages = loadMessages();
      const starterMessage = await dueDatesThread.fetchStarterMessage();
      messages[dueDatesThread.id] = starterMessage.id;
      saveMessages(messages);
    }

    return dueDatesThread.id;
  }

  if (isTextChannel(courseChannel)) {
    const channelName = `${cohortName.toLowerCase()}-due-dates`;
    let dueDatesChannel = guild.channels.cache.find(c =>
      c.type === ChannelType.GuildText && c.name === channelName
    );

    if (!dueDatesChannel) {
      try {
        dueDatesChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: courseChannel.parentId
        });
      } catch (error) {
        console.error('Failed to create due-dates channel:', error.message);
        return null;
      }
    }

    return dueDatesChannel.id;
  }

  return null;
}

async function updateDeadlineMessage(guild, reminderLocationId) {
  try {
    const channel = await guild.channels.fetch(reminderLocationId);
    if (!channel) {
      console.error('Could not find reminder location channel');
      return false;
    }

    const messages = loadMessages();
    const deadlines = loadDeadlines().filter(d => d.reminderLocationId === reminderLocationId);

    let content = '**Upcoming Deadlines:**\n\n';
    if (deadlines.length === 0) {
      content += 'No deadlines.';
    } else {
      deadlines.sort((a, b) => fromISO(a.dueDate) - fromISO(b.dueDate));
      content += deadlines.map(d => {
        const dueDate = fromISO(d.dueDate);
        return `- **${d.assignment}** - ${d.courseChannelName} - Due: ${discordTimestamp(dueDate)} (${discordTimestamp(dueDate, 'R')})`;
      }).join('\n');
    }

    const existingMessageId = messages[reminderLocationId];
    if (existingMessageId) {
      try {
        const message = await channel.messages.fetch(existingMessageId);
        await message.edit(content);
      } catch (error) {
        const newMessage = await channel.send(content);
        await newMessage.pin();
        messages[reminderLocationId] = newMessage.id;
        saveMessages(messages);
      }
    } else {
      const newMessage = await channel.send(content);
      await newMessage.pin();
      messages[reminderLocationId] = newMessage.id;
      saveMessages(messages);
    }

    return true;
  } catch (error) {
    console.error('Failed to update deadline message:', error.message);
    return false;
  }
}

module.exports = { getOrCreateReminderLocation, updateDeadlineMessage };
