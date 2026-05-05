import {
  ChannelType,
  ForumChannel,
  Guild,
  type GuildBasedChannel,
  TextChannel,
  ThreadChannel
} from "discord.js";
import { isForumChannel, isTextChannel } from "./channels";
import { loadMessages, saveMessages } from "../storage/messageStorage";

async function createForumThread(courseChannel: ForumChannel): Promise<ThreadChannel> {
  return await courseChannel.threads.create({
    name: 'Due Dates',
    message: { content: '**Upcoming Deadlines:**\n\nNo deadlines.' }
  });
}

async function registerThreadMessage(
  thread: ThreadChannel,
  guildId: string
): Promise<void> {
  const messages = loadMessages(guildId);
  const starterMessage = await thread.fetchStarterMessage();
  if(!starterMessage) return;
  messages[thread.id] = starterMessage.id;
  saveMessages(guildId, messages);
}

async function findOrCreateForumThread(
  courseChannel: ForumChannel,
  guildId: string
): Promise<string | null> {
  try {
    const threads = await courseChannel.threads.fetchActive();
    let dueDatesThread: ThreadChannel | undefined = threads.threads.find(t => t.name === 'Due Dates');

    if (!dueDatesThread) {
      dueDatesThread = await createForumThread(courseChannel);
      await registerThreadMessage(dueDatesThread, guildId);
    }

    return dueDatesThread.id;
  } catch (e) {
    console.error('Failed to create forum thread:', e);
    return null;
  }
}

async function findOrCreateTextChannel(
  guild: Guild,
  courseChannel: TextChannel,
  cohortName: string
): Promise<string | null> {
  const channelName = `${cohortName.toLowerCase()
                        .replace(/[^a-z0-9-\s]/g, '')
                        .replace(/\s+/g, '-')
                      }-due-dates`;
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
    } catch (e) {
      console.error('Failed to create due-dates channel:', e);
      return null;
    }
  }

  return dueDatesChannel.id;
}

export async function getOrCreateReminderLocation(
  guild: Guild,
  courseChannel: GuildBasedChannel,
  cohortName: string
): Promise<string | null> {
  if (isForumChannel(courseChannel))
    return await findOrCreateForumThread(courseChannel, guild.id);

  if (isTextChannel(courseChannel))
    return await findOrCreateTextChannel(guild, courseChannel, cohortName);

  return null;
}
