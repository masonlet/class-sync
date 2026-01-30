import { makeChannel, makeGuild } from '../helpers/discordMocks';

import { updateDeadlineMessage } from '../../src/services/reminderMessage';
import { loadDeadlines } from '../../src/storage/deadlineStorage';
import { loadMessages, saveMessages } from '../../src/storage/messageStorage';
import { fromISO, discordTimestamp } from '../../src/utils/time';

jest.mock('../../src/storage/deadlineStorage');
jest.mock('../../src/storage/messageStorage');
jest.mock('../../src/utils/time');

describe('reminderMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fromISO.mockImplementation((isoString) => new Date(isoString));
    discordTimestamp.mockImplementation((date, format = 'f') => {
      if (format === 'R') return '<t:123456:R>';
      return `<t:123456:${format}>`;
    });
  });

  describe('updateDeadlineMessage()', () => {
    describe('message creation', () => {
      it('creates and pins new message when no existing message', async () => {
        loadMessages.mockReturnValue({});
        loadDeadlines.mockReturnValue([
          {
            assignment: 'Assignment 1',
            courseChannelName: 'INFO0001',
            dueDate: '2026-01-01T23:59:00.000Z',
            reminderLocationId: 'channel123'
          }
        ]);
      
        const newMessage = {
          id: 'msg456',
          pin: jest.fn().mockResolvedValue(undefined)
        };
        const channel = makeChannel('channel123', 'due-dates');
        channel.send.mockResolvedValue(newMessage);

        const guild = makeGuild([channel]);
        guild.channels.fetch.mockResolvedValue(channel);

        const result = await updateDeadlineMessage(guild, 'channel123');
        expect(result).toBe(true);
        expect(channel.send).toHaveBeenCalledWith(
          expect.stringContaining('**Upcoming Deadlines:**')
        );
        expect(newMessage.pin).toHaveBeenCalled();
        expect(saveMessages).toHaveBeenCalledWith(
          'guild123', 
          { 'channel123': 'msg456' }
        );
      });

      it('updates existing message when message exists', async () => {
        loadMessages.mockReturnValue({ 'channel123': 'msg456' });
        loadDeadlines.mockReturnValue([
          {
            assignment: 'Assignment 1',
            courseChannelName: 'INFO0001',
            dueDate: '2026-01-01T23:59:00.000Z',
            reminderLocationId: 'channel123'
          }
        ]);

        const existingMessage = {
          id: 'msg456',
          edit: jest.fn().mockResolvedValue(undefined)
        };
        const channel = makeChannel('channel123', 'due-dates');
        channel.messages.fetch.mockResolvedValue(existingMessage);

        const guild = makeGuild([channel]);
        guild.channels.fetch.mockResolvedValue(channel);

        const result = await updateDeadlineMessage(guild, 'channel123');
        expect(result).toBe(true);
        expect(channel.messages.fetch).toHaveBeenCalledWith('msg456');
        expect(existingMessage.edit).toHaveBeenCalledWith(
          expect.stringContaining('**Upcoming Deadlines:**')
        );
        expect(channel.send).not.toHaveBeenCalled();
      });

      it('creates new message when existing message is deleted', async () => {
        loadMessages.mockReturnValue({ 'channel123': 'msg999' });
        loadDeadlines.mockReturnValue([]);

        const newMessage = {
          id: 'msg123',
          pin: jest.fn().mockResolvedValue(undefined)
        };
        const channel = makeChannel('channel123', 'due-dates');
        channel.messages.fetch.mockRejectedValue(new Error('Unknown Message'));
        channel.send.mockResolvedValue(newMessage);

        const guild = makeGuild([channel]);
        guild.channels.fetch.mockResolvedValue(channel);

        const result = await updateDeadlineMessage(guild, 'channel123');
        expect(result).toBe(true);
        expect(channel.send).toHaveBeenCalled();
        expect(newMessage.pin).toHaveBeenCalled();
        expect(saveMessages).toHaveBeenCalledWith(
          'guild123',
          { 'channel123': 'msg123' }
        );
      });

      describe('message content formatting', () => {
        it('displays "No deadlines" when no deadlines exist', async () => {
          loadMessages.mockReturnValue({});
          loadDeadlines.mockReturnValue([]);

          const newMessage = {
            id: 'msg222',
            pin: jest.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          channel.send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          guild.channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          expect(channel.send).toHaveBeenCalledWith(
            '**Upcoming Deadlines:**\n\nNo deadlines.'
          );
        });

        it('formats single deadline correctly', async () => {
          loadMessages.mockReturnValue({});
          loadDeadlines.mockReturnValue([
            {
              assignment: 'Final Project',
              courseChannelName: 'INFO-5101',
              dueDate: '2026-01-01T23:59:00.000Z',
              reminderLocationId: 'channel123'
            }
          ]);

          const newMessage = {
            id: 'msg333',
            pin: jest.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          channel.send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          guild.channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          expect(channel.send).toHaveBeenCalledWith(
            expect.stringMatching(/\*\*Upcoming Deadlines:\*\*\n\n- \*\*Final Project\*\* - INFO-5101 - Due:/)
          );
        });

        it('renders exact deadline message format', async () => {
          loadMessages.mockReturnValue({});
          loadDeadlines.mockReturnValue([
            {
              assignment: 'Final Project',
              courseChannelName: 'INFO-5101',
              dueDate: '2026-02-01T23:59:00.000Z',
              reminderLocationId: 'channel123'
            }
          ]);

          const newMessage = {
            id: 'msg333',
            pin: jest.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          channel.send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          guild.channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          expect(channel.send).toHaveBeenCalledWith(
            '**Upcoming Deadlines:**\n\n- **Final Project** - INFO-5101 - Due: <t:123456:f> (<t:123456:R>)'
          );
        });

        it('sorts deadlines by due date ascending', async () => {
          loadMessages.mockReturnValue({});

          const laterDate = '2026-03-30T23:59:00.000Z';
          const middleDate = '2026-02-15T23:59:00.000Z';
          const earlierDate = '2026-01-30T23:59:00.000Z';

          loadDeadlines.mockReturnValue([
            {
              assignment: 'Assignment 3',
              courseChannelName: 'INFO0001',
              dueDate: laterDate,
              reminderLocationId: 'channel123'
            },
            {
              assignment: 'Assignment 1',
              courseChannelName: 'INFO0001',
              dueDate: earlierDate,
              reminderLocationId: 'channel123'
            },
            {
              assignment: 'Assignment 2',
              courseChannelName: 'INFO0001',
              dueDate: middleDate,
              reminderLocationId: 'channel123'
            }
          ]);

          const newMessage = {
            id: 'msg321',
            pin: jest.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          channel.send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          guild.channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          const sentContent = channel.send.mock.calls[0][0];
          const assignment1Index = sentContent.indexOf('Assignment 1');
          const assignment2Index = sentContent.indexOf('Assignment 2');
          const assignment3Index = sentContent.indexOf('Assignment 3');

          expect(assignment1Index).toBeLessThan(assignment2Index);
          expect(assignment2Index).toBeLessThan(assignment3Index);
        });

        it('formats multiple deadlines with line breaks', async () => {
          loadMessages.mockReturnValue({});
          loadDeadlines.mockReturnValue([
            {
              assignment: 'Quiz 1',
              courseChannelName: 'INFO0001',
              dueDate: '2026-01-01T23:59:00.000Z',
              reminderLocationId: 'channel123'
            },
            {
              assignment: 'Assignment 3',
              courseChannelName: 'INFO0001',
              dueDate: '2026-01-01T23:59:00.000Z',
              reminderLocationId: 'channel123'
            }
          ]);

          const newMessage = {
            id: 'msg123',
            pin: jest.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          channel.send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          guild.channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          const sentContent = channel.send.mock.calls[0][0];
          expect(sentContent).toContain('Quiz 1');
          expect(sentContent).toContain('Assignment 3');
          expect(sentContent.split('\n').filter(line => line.startsWith('-')).length).toBe(2);
        });

        it('renders duplicate deadlines as separate entries', async () => {
          loadMessages.mockReturnValue({});
          loadDeadlines.mockReturnValue([
            {
              assignment: 'Midterm Exam',
              courseChannelName: 'CS101',
              dueDate: '2026-01-20T23:59:00.000Z',
              reminderLocationId: 'channel123'
            },
            {
              assignment: 'Midterm Exam',
              courseChannelName: 'CS101',
              dueDate: '2026-01-20T23:59:00.000Z',
              reminderLocationId: 'channel123'
            }
          ]);

          const newMessage = {
            id: 'msg666',
            pin: jest.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          channel.send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          guild.channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          const sentContent = channel.send.mock.calls[0][0];
          expect(sentContent.match(/- \*\*/g).length).toBe(2);
        });
      });

      describe('deadline filtering', () => {
        it('only includes deadlines for the specified reminder location', async () => {
          loadMessages.mockReturnValue({});
          loadDeadlines.mockReturnValue([
            {
              assignment: 'Assignment A',
              courseChannelName: 'INFO0001',
              dueDate: '2026-01-01T23:59:00.000Z',
              reminderLocationId: 'channel123'
            },
            {
              assignment: 'Assignment B',
              courseChannelName: 'INFO0002',
              dueDate: '2026-01-01T23:59:00.000Z',
              reminderLocationId: 'channel456'
            }
          ]);

          const newMessage = {
            id: 'msg666',
            pin: jest.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          channel.send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          guild.channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          const sentContent = channel.send.mock.calls[0][0];
          expect(sentContent).toContain('Assignment A');
          expect(sentContent).not.toContain('Assignment B');
        });
      });
    });

    describe('error handling', () => {
      it('returns false when channel is not found', async () => {
        const guild = makeGuild([]);
        guild.channels.fetch.mockResolvedValue(null);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await updateDeadlineMessage(guild, 'nonexistent');

        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Could not find reminder location channel'
        );
        consoleErrorSpy.mockRestore();
      });

      it('returns false and logs error when channel fetch fails', async () => {
        const guild = makeGuild([]);
        guild.channels.fetch.mockRejectedValue(new Error('Network error'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await updateDeadlineMessage(guild, 'channel123');

        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to update deadline message:',
          'Network error'
        );
        consoleErrorSpy.mockRestore();
      });

      it('returns false when message send fails', async () => {
        loadMessages.mockReturnValue({});
        loadDeadlines.mockReturnValue([]);

        const channel = makeChannel('channel123', 'due-dates');
        channel.send.mockRejectedValue(new Error('Permission denied'));

        const guild = makeGuild([channel]);
        guild.channels.fetch.mockResolvedValue(channel);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await updateDeadlineMessage(guild, 'channel123');

        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to update deadline message:',
          'Permission denied'
        );
        consoleErrorSpy.mockRestore();
      });

      it('returns false when pin fails', async () => {
        loadMessages.mockReturnValue({});
        loadDeadlines.mockReturnValue([]);

        const newMessage = {
          id: 'msg777',
          pin: jest.fn().mockRejectedValue(new Error('Pin limit reached'))
        };
        const channel = makeChannel('channel123', 'due-dates');
        channel.send.mockResolvedValue(newMessage);

        const guild = makeGuild([channel]);
        guild.channels.fetch.mockResolvedValue(channel);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await updateDeadlineMessage(guild, 'channel123');

        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to update deadline message:',
          'Pin limit reached'
        );
        consoleErrorSpy.mockRestore();
      });
    });

    describe('edge cases', () => {
      it('handles deadlines with special characters in names', async () => {
        loadMessages.mockReturnValue({});
        loadDeadlines.mockReturnValue([
          {
            assignment: 'Quiz #2 (Part A&B)',
            courseChannelName: 'CS-101',
            dueDate: '2026-01-20T23:59:00.000Z',
            reminderLocationId: 'channel123'
          }
        ]);

        const newMessage = {
          id: 'msg888',
          pin: jest.fn().mockResolvedValue(undefined)
        };
        const channel = makeChannel('channel123', 'due-dates');
        channel.send.mockResolvedValue(newMessage);

        const guild = makeGuild([channel]);
        guild.channels.fetch.mockResolvedValue(channel);

        const result = await updateDeadlineMessage(guild, 'channel123');

        expect(result).toBe(true);
        expect(channel.send).toHaveBeenCalledWith(
          expect.stringContaining('Quiz #2 (Part A&B)')
        );
      });

      it('handles very long assignment names', async () => {
        const longName = 'A'.repeat(200);
        loadMessages.mockReturnValue({});
        loadDeadlines.mockReturnValue([
          {
            assignment: longName,
            courseChannelName: 'CS101',
            dueDate: '2026-01-20T23:59:00.000Z',
            reminderLocationId: 'channel123'
          }
        ]);

        const newMessage = {
          id: 'msg999',
          pin: jest.fn().mockResolvedValue(undefined)
        };
        const channel = makeChannel('channel123', 'due-dates');
        channel.send.mockResolvedValue(newMessage);

        const guild = makeGuild([channel]);
        guild.channels.fetch.mockResolvedValue(channel);

        const result = await updateDeadlineMessage(guild, 'channel123');

        expect(result).toBe(true);
        expect(channel.send).toHaveBeenCalledWith(
          expect.stringContaining(longName)
        );
      });

      it('preserves existing message IDs when replacing deleted message', async () => {
        loadMessages.mockReturnValue({ 'other-channel': 'msg-old' });
        loadDeadlines.mockReturnValue([]);

        const newMessage = {
          id: 'msg-new',
          pin: jest.fn().mockResolvedValue(undefined)
        };
        const channel = makeChannel('channel123', 'due-dates');
        channel.send.mockResolvedValue(newMessage);

        const guild = makeGuild([channel]);
        guild.channels.fetch.mockResolvedValue(channel);

        await updateDeadlineMessage(guild, 'channel123');

        expect(saveMessages).toHaveBeenCalledWith(
          'guild123',
          { 
            'other-channel': 'msg-old',
            'channel123': 'msg-new' 
          }
        );
      });
    });
  });
});
