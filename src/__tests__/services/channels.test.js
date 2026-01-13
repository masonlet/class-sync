const { ChannelType } = require('discord.js');
const { resolveChannel, isForumChannel, isTextChannel } = require('../../services/channels');

const makeChannel = (id, name, type = ChannelType.GuildText) => ({
  id,
  name,
  type
});

class MockCollection extends Map {
  filter(fn) {
    const filtered = new MockCollection();
    for (const [key, value] of this) {
      if (fn(value, key, this)) {
        filtered.set(key, value);
      }
    }
    return filtered;
  }

  first() {
    return this.values().next().value;
  }
}

const makeGuild = (channels) => ({
  channels: {
    cache: new MockCollection(channels.map(c => [c.id, c]))
  }
});

describe('channels', () => {
  describe('resolveChannel()', () => {
    it('ID resolution', () => {
      const channel = makeChannel('123', 'general');
      const guild = makeGuild([channel]);

      const result = resolveChannel(guild, '<#123>');
      expect(result).toBe(channel);
    });

    it('returns null for mention with non-existent ID', () => {
      const guild = makeGuild([makeChannel('123', 'general')]);

      const result = resolveChannel(guild, '<#999>');
      expect(result).toBeNull();
    });

    it('ignores non-mention format IDs', () => {
      const channel = makeChannel('123', 'general');
      const guild = makeGuild([channel]);

      const result = resolveChannel(guild, '123');
      expect(result).not.toBe(channel);
    });
  });

  describe('exact name matching', () => {
    it('matches exact channel name', () => {
      const channel = makeChannel('1', 'general');
      const guild = makeGuild([channel]);

      const result = resolveChannel(guild, 'general');
      expect(result).toBe(channel);
    });

    it('normalizes spaces to hyphens', () => {
      const channel = makeChannel('1', 'course-announcements');
      const guild = makeGuild([channel]);

      const result = resolveChannel(guild, 'course announcements');
      expect(result).toBe(channel);
    });

    it('is case insensitive', () => {
      const channel = makeChannel('1', 'general');
      const guild = makeGuild([channel]);

      const result = resolveChannel(guild, 'GENERAL');
      expect(result).toBe(channel);
    });

    it('returns DUPLICATE for multiple exact matches', () => {
      const guild = makeGuild([
        makeChannel('1', 'general-one'),
        makeChannel('2', 'general-two')
      ]);

      const result = resolveChannel(guild, 'general');
      expect(result).toBe('DUPLICATE');
    });
  });

  describe('keyword matching', () => {
    it('matches channel containg all keywords', () => {
      const channel = makeChannel('1', 'info-5101-csharp-advanced');
      const guild = makeGuild([channel]);

      const result = resolveChannel(guild, 'info 5101 csharp advanced');
      expect(result).toBe(channel);
    });

    it('returns DUPLICATE for multiple keyword matches', () => {
      const guild = makeGuild([
        makeChannel('1', 'info-5101-csharp-advanced'),
        makeChannel('2', 'info-5060-dotnet-advanced')
      ]);

      const result = resolveChannel(guild, 'info advanced');
      expect(result).toBe('DUPLICATE');
    });

    it('returns null when no keywords match', () => {
      const channel = makeChannel('1', 'general');
      const guild = makeGuild([channel]);

      const result = resolveChannel(guild, 'info 5101');
      expect(result).toBeNull();
    });

    it('requires all keywords to match', () => {
      const channel = makeChannel('1', 'info-5101');
      const guild = makeGuild([channel]);

      const result = resolveChannel(guild, 'info 5101 test');
      expect(result).toBeNull();
    });

    it('handles special characters in input', () => {
      const channel = makeChannel('1', 'general');
      const guild = makeGuild([channel]);

      const result = resolveChannel(guild, 'general!@#');
      expect(result).toBe(channel);
    });
  });

  describe('channel type filtering', () => {
    it('only considers text and forum channels', () => {
      const textChannel = makeChannel('1', 'general', ChannelType.GuildText);
      const forumChannel = makeChannel('2', 'help', ChannelType.GuildForum);
      const voiceChannel = makeChannel('3', 'voice', ChannelType.GuildVoice);
      const guild = makeGuild([textChannel, forumChannel, voiceChannel]);

      expect(resolveChannel(guild, 'general')).toBe(textChannel);
      expect(resolveChannel(guild, 'help')).toBe(forumChannel);
      expect(resolveChannel(guild, 'voice')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('returns null for null courseInput', () => {
      const guild = makeGuild([makeChannel('1', 'general')]);
      expect(resolveChannel(guild, null)).toBeNull();
    });

    it('returns null for undefined courseInput', () => {
      const guild = makeGuild([makeChannel('1', 'general')]);
      expect(resolveChannel(guild, undefined)).toBeNull();
    });

    it('returns null for null guild', () => {
      expect(resolveChannel(null, 'general')).toBeNull();
    });

    it('trims whitespace from input', () => {
      const channel = makeChannel('1', 'general');
      const guild = makeGuild([channel]);

      const result = resolveChannel(guild, '  general  ');
      expect(result).toBe(channel);
    });

    it('returns null for empty string after normalization', () => {
      const guild = makeGuild([makeChannel('1', 'general')]);
      expect(resolveChannel(guild, '   ')).toBeNull();
    });
  });

  describe('resolution priority', () => {
    it('prioritizes ID resolution over exact match', () => {
      const channelById = makeChannel('123', 'other');
      const channelByName = makeChannel('456', 'exact-match');
      const guild = makeGuild([channelById, channelByName]);

      const result = resolveChannel(guild, '<#123>');
      expect(result).toBe(channelById);
    });

    it('prioritizes exact match over keyword match', () => {
      const exactMatch = makeChannel('1', 'cs101');
      const keywordMatch = makeChannel('2', 'cs101-section-a');
      const guild = makeGuild([exactMatch, keywordMatch]);

      const result = resolveChannel(guild, 'cs101');
      expect(result).toBe(exactMatch);
    });
  });

  describe('isForumChannel()', () => {
    it('returns true for forum channel', () => {
      const channel = makeChannel('1', 'forum', ChannelType.GuildForum);
      expect(isForumChannel(channel)).toBe(true);
    });

    it('returns false for text channel', () => {
      const channel = makeChannel('1', 'text', ChannelType.GuildText);
      expect(isForumChannel(channel)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isForumChannel(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isForumChannel(undefined)).toBe(false);
    });
  });

  describe('isTextChannel()', () => {
    it('returns true for text channel', () => {
      const channel = makeChannel('1', 'text', ChannelType.GuildText);
      expect(isTextChannel(channel)).toBe(true);
    });

    it('returns false for forum channel', () => {
      const channel = makeChannel('1', 'forum', ChannelType.GuildForum);
      expect(isTextChannel(channel)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isTextChannel(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isTextChannel(undefined)).toBe(false);
    });
  });
});
