const { ChannelType } = require('discord.js');
const { isForumChannel, isTextChannel } = require('./channels');
const { loadMessages, saveMessages } = require('../storage/messageStorage');

async function createForumThread(courseChannel) {
  const dueDatesThread = await courseChannel.threads.create({
    name: 'Due Dates',
    message: { content: '**Upcoming Deadlines:**\n\nNo deadlines.' }
  });
  return dueDatesThread;
}

async function registerThreadMessage(thread) {
  const messages = loadMessages();
  const starterMessage = await thread.fetchStarterMessage();
  if(!starterMessage) return;

  messages[thread.id] = starterMessage.id;
  saveMessages(messages);
}

async function findOrCreateForumThread(courseChannel) {
  try {
    const threads = await courseChannel.threads.fetchActive();
    let dueDatesThread = threads.threads.find(t => t.name === 'Due Dates');

    if (!dueDatesThread) {
      dueDatesThread = await createForumThread(courseChannel);
      await registerThreadMessage(dueDatesThread);
    }

    return dueDatesThread.id;
  } catch (error) {
    console.error('Failed to create forum thread:', error);
    return null;
  }
}

async function findOrCreateTextChannel(guild, courseChannel, cohortName) {
  const channelName = `${cohortName.toLowerCase().replace(/[^a-z0-9-\s]/g, '').replace(/\s+/g, '-')}-due-dates`;
  let dueDatesChannel = guild.channels.cache.find(c =>
    c.type === ChannelType.GuildText &&
    c.name === channelName &&
    c.parentId === courseChannel.parentId
  );

  if (!dueDatesChannel) {
    try {
      dueDatesChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: courseChannel.parentId ?? null
      });
    } catch (error) {
      console.error('Failed to create due-dates channel:', error);
      return null;
    }
  }

  return dueDatesChannel.id;
}

async function getOrCreateReminderLocation(guild, courseChannel, cohortName) {
  if (isForumChannel(courseChannel)) 
    return await findOrCreateForumThread(courseChannel);
  
  if (isTextChannel(courseChannel)) 
    return await findOrCreateTextChannel(guild, courseChannel, cohortName);

  return null;
}

module.exports = { getOrCreateReminderLocation };
