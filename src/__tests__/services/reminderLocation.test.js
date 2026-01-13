const { ChannelType } = require('discord.js');
const { getOrCreateReminderLocation } = require('../../services/reminderLocation');
const { loadMessages, saveMessages } = require('../../storage/messageStorage');

jest.mock('../../storage/messageStorage');

const makeChannel = (id, name, type = ChannelType.GuildText, parentId = null) => ({
  id,
  name,
  type,
  parentId,
  threads: {
    create: jest.fn(),
    fetchActive: jest.fn()
  }
});

const makeThread = (id, name) => ({
  id,
  name,
  fetchStarterMessage: jest.fn()
});

class MockCollection extends Map {
  find(fn) {
    for (const [key, value] of this) {
      if(fn(value, key, this)) return value;
    }
    return undefined;
  }
}

const makeGuild = (channels) => ({
  channels: {
    cache: new MockCollection(channels.map(c => [c.id, c])),
    create: jest.fn()
  }
});

describe('reminderLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('forum channels', () => {
    it('returns existing Due Dates thead', async () => {
      const thread = makeThread('thread123', 'Due Dates');
      const forumChannel = makeChannel('1', 'forum', ChannelType.GuildForum);
      const activeThreads = new MockCollection([['thread123', thread]]);
      forumChannel.threads.fetchActive.mockResolvedValue({ threads: activeThreads });

      const guild = makeGuild([forumChannel]);
      const result = await getOrCreateReminderLocation(guild, forumChannel, 'cohort');

      expect(result).toBe('thread123');
      expect(forumChannel.threads.create).not.toHaveBeenCalled();
    });

    it('creates new Due Dates thread if not found and registers starter message', async () => {
      const newThread = makeThread('thread456', 'Due Dates');
      const starterMessage = { id: 'msg123' };
      newThread.fetchStarterMessage.mockResolvedValue(starterMessage);

      const forumChannel = makeChannel('1', 'forum', ChannelType.GuildForum);
      forumChannel.threads.fetchActive.mockResolvedValue({ threads: new MockCollection() });
      forumChannel.threads.create.mockResolvedValue(newThread);

      loadMessages.mockReturnValue({});
      saveMessages.mockImplementation(() => {});

      const guild = makeGuild([forumChannel]);
      const result = await getOrCreateReminderLocation(guild, forumChannel, 'cohort');

      expect(result).toBe('thread456');
      expect(forumChannel.threads.create).toHaveBeenCalledWith({
        name: 'Due Dates',
        message: { content: '**Upcoming Deadlines:**\n\nNo deadlines.' }
      });
      expect(saveMessages).toHaveBeenCalledWith({ 'thread456': 'msg123' });
    });

    it('does nothing if starter message is missing', async () => {
      const newThread = makeThread('thread789', 'Due Dates');
      newThread.fetchStarterMessage.mockResolvedValue(null);

      const forumChannel = makeChannel('1', 'forum', ChannelType.GuildForum);
      forumChannel.threads.fetchActive.mockResolvedValue({ threads: new MockCollection() });
      forumChannel.threads.create.mockResolvedValue(newThread);

      loadMessages.mockReturnValue({ existing: 'value' });
      saveMessages.mockImplementation(() => {});

      const guild = makeGuild([forumChannel]);
      const result = await getOrCreateReminderLocation(guild, forumChannel, 'cohort');

      expect(result).toBe('thread789');
      expect(saveMessages).not.toHaveBeenCalled();
    });

   it('returns null if forum thread creation fails with proper error', async () => {
      const forumChannel = makeChannel('1', 'forum', ChannelType.GuildForum);
      forumChannel.threads.fetchActive.mockResolvedValue({ threads: new MockCollection() });
      forumChannel.threads.create.mockRejectedValue(new Error('Permission denied'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const guild = makeGuild([forumChannel]);
      const result = await getOrCreateReminderLocation(guild, forumChannel, 'cohort');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create forum thread:',
        expect.any(Error),
      );
      expect(consoleErrorSpy.mock.calls[0][1].message).toBe('Permission denied');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('text channels', () => {
    it('returns existing due-dates channel', async () => {
      const courseChannel = makeChannel('1', 'course', ChannelType.GuildText, 'parent123');
      const dueDatesChannel = makeChannel('2', 'cohort-due-dates', ChannelType.GuildText, 'parent123');
      const guild = makeGuild([courseChannel, dueDatesChannel]);

      const result = await getOrCreateReminderLocation(guild, courseChannel, 'cohort');
      expect(result).toBe('2');
      expect(guild.channels.create).not.toHaveBeenCalledWith();
    });

    it('creates new due-dates channel if not found with correct name', async () => {
      const courseChannel = makeChannel('1', 'course', ChannelType.GuildText, 'parent123');
      const newChannel = makeChannel('2', 'cohort-due-dates', ChannelType.GuildText, 'parent123');

      const guild = makeGuild([courseChannel]);
      guild.channels.create.mockResolvedValue(newChannel);

      const result = await getOrCreateReminderLocation(guild, courseChannel, 'cohort');
      expect(result).toBe('2');
      expect(guild.channels.create).toHaveBeenCalledWith({
        name: 'cohort-due-dates',
        type: ChannelType.GuildText,
        parent: 'parent123'
      });
    });

    it('normalizes cohort name to lowercase', async () => {
      const courseChannel = makeChannel('1', 'course', ChannelType.GuildText, 'parent123');
      const dueDatesChannel = makeChannel('2', 'a-due-dates', ChannelType.GuildText, 'parent123');
      const guild = makeGuild([courseChannel, dueDatesChannel]);

      const result = await getOrCreateReminderLocation(guild, courseChannel, 'A');
      expect(result).toBe('2');
    });

    it('handles cohort names with spaces', async () => {
      const courseChannel = makeChannel('1', 'course', ChannelType.GuildText, 'parent123');
      const dueDatesChannel = makeChannel('2', 'my-cohort-due-dates', ChannelType.GuildText, 'parent123');

      const guild = makeGuild([courseChannel, dueDatesChannel]);

      const result = await getOrCreateReminderLocation(guild, courseChannel, 'My Cohort');
      expect(result).toBe('2');
    });

    it('finds channel in same category, not different category', async () => {
      const courseChannel = makeChannel('1', 'course', ChannelType.GuildText, 'parent123');
      const wrongCategoryChannel = makeChannel('2', 'cohort-due-dates', ChannelType.GuildText, 'parent456');
      const newChannel = makeChannel('3', 'cohort-due-dates', ChannelType.GuildText, 'parent123');

      const guild = makeGuild([courseChannel, wrongCategoryChannel]);
      guild.channels.create.mockResolvedValue(newChannel);

      const result = await getOrCreateReminderLocation(guild, courseChannel, 'cohort');

      expect(result).toBe('3');
      expect(guild.channels.create).toHaveBeenCalled();
    });

    it('creates channel when course has no parent category (null)', async () => {
      const courseChannel = makeChannel('1', 'course', ChannelType.GuildText, null);
      const newChannel = makeChannel('2', 'cohort-due-dates', ChannelType.GuildText, null);
      const guild = makeGuild([courseChannel]);

      guild.channels.create.mockResolvedValue(newChannel);

      const result = await getOrCreateReminderLocation(guild, courseChannel, 'cohort');

      expect(result).toBe('2');
      expect(guild.channels.create).toHaveBeenCalledWith({
        name: 'cohort-due-dates',
        type: ChannelType.GuildText,
        parent: null,
      });
    });

    it('creates channel when course has no parent category (undefined)', async () => {
      const courseChannel = makeChannel('1', 'course', ChannelType.GuildText, undefined);
      const newChannel = makeChannel('2', 'cohort-due-dates', ChannelType.GuildText, undefined);
      const guild = makeGuild([courseChannel]);

      guild.channels.create.mockResolvedValue(newChannel);

      const result = await getOrCreateReminderLocation(guild, courseChannel, 'cohort');

      expect(result).toBe('2');
      expect(guild.channels.create).toHaveBeenCalledWith({
        name: 'cohort-due-dates',
        type: ChannelType.GuildText,
        parent: null,
      });
    });

    it('returns null if channel creation fails with proper error', async () => {
      const courseChannel = makeChannel('1', 'course', ChannelType.GuildText, 'parent123');
      const guild = makeGuild([courseChannel]);

      guild.channels.create.mockRejectedValue(new Error('Permission denied'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getOrCreateReminderLocation(guild, courseChannel, 'cohort');
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create due-dates channel:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('returns null for unsupported channel type', async () => {
      const voiceChannel = makeChannel('1', 'voice', ChannelType.GuildVoice);
      const guild = makeGuild([voiceChannel]);

      const result = await getOrCreateReminderLocation(guild, voiceChannel, 'cohort');
      expect(result).toBeNull();
    });
  });
});
