const { ChannelType } = require('discord.js');
const { isForumChannel, isTextChannel } = require('./channels');

async function getOrCreateReminderLocation(guild, courseChannel, cohortName) {
  if (isForumChannel(courseChannel)) {
    const threads = await courseChannel.threads.fetchActive();
    let dueDatesThread = threads.threads.find(t => t.name === 'Due Dates');

    if (!dueDatesThread) {
      dueDatesThread = await courseChannel.threads.create({
        name: 'Due Dates',
        message: { content: 'This thread tracks upcoming deadlines.' }
      });
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

async function postDeadlineMessage(guild, reminderLocationId, deadline) {
  try {
    const channel = await guild.channels.fetch(reminderLocationId);

    if (!channel) {
      console.error('Could not find reminder location channel');
      return false;
    }

    const dueDate = new Date(deadline.dueDate);
    const message = `**${deadline.assignment}** is due on ${dueDate.toLocaleString()}`;

    await channel.send(message);
    return true;
  } catch (error) {
    console.error('Failed to post deadline message:', error.message);
    return false;
  }
}

module.exports = { getOrCreateReminderLocation, postDeadlineMessage };
