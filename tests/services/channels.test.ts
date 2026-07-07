import { describe, it, expect } from 'vitest';
import { ChannelType } from 'discord.js';
import { makeChannel, makeGuild } from '../helpers/discordMocks';
import { resolveChannel, isForumChannel, isTextChannel } from '../../src/services/channels';
import type { Channel } from '../../src/types';

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

    describe('performance and edge cases', () => {
      it('handles large channel collections efficiently', () => {
        const channels: Channel[] = [];
        for (let i = 0; i < 1000; i++) {
          channels.push(makeChannel(`${i}`, `channel-${i}`));
        }
        channels.push(makeChannel('target', 'target-channel'));

        const guild = makeGuild(channels);
        const start = Date.now();
        const result = resolveChannel(guild, 'target-channel');
        const duration = Date.now() - start;

        expect((result as Channel).id).toBe('target');
        expect(duration).toBeLessThan(100);
      });

      it('handles channels with unicode characters', () => {
        const channel = makeChannel('1', '日本語-チャンネル');
        const guild = makeGuild([channel]);

        const result = resolveChannel(guild, '日本語-チャンネル');
        expect(result).toBe(channel);
      });

      it('handles channels with emoji in names', () => {
        const channel = makeChannel('1', '🎮-gaming');
        const guild = makeGuild([channel]);

        const result = resolveChannel(guild, '🎮-gaming');
        expect(result).toBe(channel);
      });

      it('handles extremely long channel names', () => {
        const longName = 'a'.repeat(100);
        const channel = makeChannel('1', longName);
        const guild = makeGuild([channel]);

        const result = resolveChannel(guild, longName);
        expect(result).toBe(channel);
      });

      it('handles multiple consecutive spaces in input', () => {
        const channel = makeChannel('1', 'course-name');
        const guild = makeGuild([channel]);

        const result = resolveChannel(guild, 'course    name');
        expect(result).toBe(channel);
      });
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
    it('matches channel containing all keywords', () => {
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
