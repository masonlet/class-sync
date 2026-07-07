import { describe, it, expect, vi, beforeEach } from 'vitest';
import { asMockChannel, asMockGuild, makeChannel, makeGuild } from '../helpers/discordMocks.js';
import { updateDeadlineMessage                              } from '../../src/services/reminderMessage.js';
import { loadDeadlines                                      } from '../../src/storage/deadlineStorage.js';
import { loadMessages, saveMessages                         } from '../../src/storage/messageStorage.js';
import { fromISO, discordTimestamp                          } from '../../src/utils/time.js';
import { makeDeadline                                       } from '../helpers/interactions.js';

vi.mock('../../src/storage/deadlineStorage');
vi.mock('../../src/storage/messageStorage');
vi.mock('../../src/utils/time');

describe('reminderMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fromISO).mockImplementation((isoString) => new Date(isoString));
    vi.mocked(discordTimestamp).mockImplementation((_date, format = 'f') => {
      if (format === 'R') return '<t:123456:R>';
      return `<t:123456:${format}>`;
    });
  });

  describe('updateDeadlineMessage()', () => {
    describe('message creation', () => {
      it('creates and pins new message when no existing message', async () => {
        vi.mocked(loadMessages).mockReturnValue({});
        vi.mocked(loadDeadlines).mockReturnValue([
          makeDeadline({
            assignment: 'Assignment 1',
            courseChannelName: 'INFO0001',
            dueDate: '2026-01-01T23:59:00.000Z',
            reminderLocationId: 'channel123'
          })
        ]);

        const newMessage = {
          id: 'msg456',
          pin: vi.fn().mockResolvedValue(undefined)
        };
        const channel = makeChannel('channel123', 'due-dates');
        asMockChannel(channel).send.mockResolvedValue(newMessage);

        const guild = makeGuild([channel]);
       asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

        const result = await updateDeadlineMessage(guild, 'channel123');
        expect(result).toBe(true);
        expect(asMockChannel(channel).send).toHaveBeenCalledWith(
          expect.stringContaining('**Upcoming Deadlines:**')
        );
        expect(newMessage.pin).toHaveBeenCalled();
        expect(saveMessages).toHaveBeenCalledWith(
          'guild123', 
          { 'channel123': 'msg456' }
        );
      });

      it('updates existing message when message exists', async () => {
        vi.mocked(loadMessages).mockReturnValue({ 'channel123': 'msg456' });
        vi.mocked(loadDeadlines).mockReturnValue([
          makeDeadline({
            assignment: 'Assignment 1',
            courseChannelName: 'INFO0001',
            dueDate: '2026-01-01T23:59:00.000Z',
            reminderLocationId: 'channel123'
          })
        ]);

        const existingMessage = {
          id: 'msg456',
          edit: vi.fn().mockResolvedValue(undefined)
        };
        const channel = makeChannel('channel123', 'due-dates');
       asMockChannel(channel).messages.fetch.mockResolvedValue(existingMessage);

        const guild = makeGuild([channel]);
        asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

        const result = await updateDeadlineMessage(guild, 'channel123');
        expect(result).toBe(true);
        expect(asMockChannel(channel).messages.fetch).toHaveBeenCalledWith('msg456');
        expect(existingMessage.edit).toHaveBeenCalledWith(
          expect.stringContaining('**Upcoming Deadlines:**')
        );
        expect(asMockChannel(channel).send).not.toHaveBeenCalled();
      });

      it('creates new message when existing message is deleted', async () => {
        vi.mocked(loadMessages).mockReturnValue({ 'channel123': 'msg999' });
        vi.mocked(loadDeadlines).mockReturnValue([]);

        const newMessage = {
          id: 'msg123',
          pin: vi.fn().mockResolvedValue(undefined)
        };
        const channel = makeChannel('channel123', 'due-dates');
        asMockChannel(channel).messages.fetch.mockRejectedValue(new Error('Unknown Message'));
        asMockChannel(channel).send.mockResolvedValue(newMessage);

        const guild = makeGuild([channel]);
        asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

        const result = await updateDeadlineMessage(guild, 'channel123');
        expect(result).toBe(true);
        expect(asMockChannel(channel).send).toHaveBeenCalled();
        expect(newMessage.pin).toHaveBeenCalled();
        expect(saveMessages).toHaveBeenCalledWith(
          'guild123',
          { 'channel123': 'msg123' }
        );
      });

      describe('message content formatting', () => {
        it('displays "No deadlines" when no deadlines exist', async () => {
          vi.mocked(loadMessages).mockReturnValue({});
          vi.mocked(loadDeadlines).mockReturnValue([]);

          const newMessage = {
            id: 'msg222',
            pin: vi.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          asMockChannel(channel).send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          expect(asMockChannel(channel).send).toHaveBeenCalledWith(
            '**Upcoming Deadlines:**\n\nNo deadlines.'
          );
        });

        it('formats single deadline correctly', async () => {
          vi.mocked(loadMessages).mockReturnValue({});
          vi.mocked(loadDeadlines).mockReturnValue([
            makeDeadline({
              assignment: 'Final Project',
              courseChannelName: 'INFO-5101',
              dueDate: '2026-01-01T23:59:00.000Z',
              reminderLocationId: 'channel123'
            })
          ]);

          const newMessage = {
            id: 'msg333',
            pin: vi.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          asMockChannel(channel).send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          expect(asMockChannel(channel).send).toHaveBeenCalledWith(
            expect.stringMatching(/\*\*Upcoming Deadlines:\*\*\n\n- \*\*Final Project\*\* - INFO-5101 - Due:/)
          );
        });

        it('renders exact deadline message format', async () => {
          vi.mocked(loadMessages).mockReturnValue({});
          vi.mocked(loadDeadlines).mockReturnValue([
            makeDeadline({
              assignment: 'Final Project',
              courseChannelName: 'INFO-5101',
              dueDate: '2026-02-01T23:59:00.000Z',
              reminderLocationId: 'channel123'
            })
          ]);

          const newMessage = {
            id: 'msg333',
            pin: vi.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          asMockChannel(channel).send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          expect(asMockChannel(channel).send).toHaveBeenCalledWith(
            '**Upcoming Deadlines:**\n\n- **Final Project** - INFO-5101 - Due: <t:123456:f> (<t:123456:R>)'
          );
        });

        it('sorts deadlines by due date ascending', async () => {
          vi.mocked(loadMessages).mockReturnValue({});

          const laterDate = '2026-03-30T23:59:00.000Z';
          const middleDate = '2026-02-15T23:59:00.000Z';
          const earlierDate = '2026-01-30T23:59:00.000Z';

          vi.mocked(loadDeadlines).mockReturnValue([
            makeDeadline({
              assignment: 'Assignment 3',
              courseChannelName: 'INFO0001',
              dueDate: laterDate,
              reminderLocationId: 'channel123'
            }),
            makeDeadline({
              assignment: 'Assignment 1',
              courseChannelName: 'INFO0001',
              dueDate: earlierDate,
              reminderLocationId: 'channel123'
            }),
            makeDeadline({
              assignment: 'Assignment 2',
              courseChannelName: 'INFO0001',
              dueDate: middleDate,
              reminderLocationId: 'channel123'
            })
          ]);

          const newMessage = {
            id: 'msg321',
            pin: vi.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          asMockChannel(channel).send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          const sentContent = asMockChannel(channel).send.mock.calls[0]![0] as string;
          const assignment1Index = sentContent.indexOf('Assignment 1');
          const assignment2Index = sentContent.indexOf('Assignment 2');
          const assignment3Index = sentContent.indexOf('Assignment 3');

          expect(assignment1Index).toBeLessThan(assignment2Index);
          expect(assignment2Index).toBeLessThan(assignment3Index);
        });

        it('formats multiple deadlines with line breaks', async () => {
          vi.mocked(loadMessages).mockReturnValue({});
          vi.mocked(loadDeadlines).mockReturnValue([
            makeDeadline({
              assignment: 'Quiz 1',
              courseChannelName: 'INFO0001',
              dueDate: '2026-01-01T23:59:00.000Z',
              reminderLocationId: 'channel123'
            }),
            makeDeadline({
              assignment: 'Assignment 3',
              courseChannelName: 'INFO0001',
              dueDate: '2026-01-01T23:59:00.000Z',
              reminderLocationId: 'channel123'
            })
          ]);

          const newMessage = {
            id: 'msg123',
            pin: vi.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          asMockChannel(channel).send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          const sentContent = asMockChannel(channel).send.mock.calls[0]![0] as string;
          expect(sentContent).toContain('Quiz 1');
          expect(sentContent).toContain('Assignment 3');
          expect(sentContent.split('\n').filter(line => line.startsWith('-')).length).toBe(2);
        });

        it('renders duplicate deadlines as separate entries', async () => {
          vi.mocked(loadMessages).mockReturnValue({});
          vi.mocked(loadDeadlines).mockReturnValue([
            makeDeadline({
              assignment: 'Midterm Exam',
              courseChannelName: 'CS101',
              dueDate: '2026-01-20T23:59:00.000Z',
              reminderLocationId: 'channel123'
            }),
            makeDeadline({
              assignment: 'Midterm Exam',
              courseChannelName: 'CS101',
              dueDate: '2026-01-20T23:59:00.000Z',
              reminderLocationId: 'channel123'
            })
          ]);

          const newMessage = {
            id: 'msg666',
            pin: vi.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          asMockChannel(channel).send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          const sentContent = asMockChannel(channel).send.mock.calls[0]![0] as string;
          expect(sentContent.match(/- \*\*/g)!.length).toBe(2);
        });
      });

      describe('deadline filtering', () => {
        it('only includes deadlines for the specified reminder location', async () => {
          vi.mocked(loadMessages).mockReturnValue({});
          vi.mocked(loadDeadlines).mockReturnValue([
            makeDeadline({
              assignment: 'Assignment A',
              courseChannelName: 'INFO0001',
              dueDate: '2026-01-01T23:59:00.000Z',
              reminderLocationId: 'channel123'
            }),
            makeDeadline({
              assignment: 'Assignment B',
              courseChannelName: 'INFO0002',
              dueDate: '2026-01-01T23:59:00.000Z',
              reminderLocationId: 'channel456'
            })
          ]);

          const newMessage = {
            id: 'msg666',
            pin: vi.fn().mockResolvedValue(undefined)
          };
          const channel = makeChannel('channel123', 'due-dates');
          asMockChannel(channel).send.mockResolvedValue(newMessage);

          const guild = makeGuild([channel]);
          asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

          await updateDeadlineMessage(guild, 'channel123');

          const sentContent = asMockChannel(channel).send.mock.calls[0]![0] as string;
          expect(sentContent).toContain('Assignment A');
          expect(sentContent).not.toContain('Assignment B');
        });
      });
    });

    describe('error handling', () => {
      it('returns false when channel is not found', async () => {
        const guild = makeGuild([]);
        asMockGuild(guild).channels.fetch.mockResolvedValue(null);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await updateDeadlineMessage(guild, 'nonexistent');

        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Could not find reminder location channel');
        consoleErrorSpy.mockRestore();
      });

      it('returns false and logs error when channel fetch fails', async () => {
        const guild = makeGuild([]);
        asMockGuild(guild).channels.fetch.mockRejectedValue(new Error('Network error'));

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await updateDeadlineMessage(guild, 'channel123');

        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to update deadline message:',
          expect.objectContaining({ message: 'Network error' })
        );
        consoleErrorSpy.mockRestore();
      });

      it('returns false when message send fails', async () => {
        vi.mocked(loadMessages).mockReturnValue({});
        vi.mocked(loadDeadlines).mockReturnValue([]);

        const channel = makeChannel('channel123', 'due-dates');
        asMockChannel(channel).send.mockRejectedValue(new Error('Permission denied'));

        const guild = makeGuild([channel]);
        asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await updateDeadlineMessage(guild, 'channel123');

        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to update deadline message:',
          expect.objectContaining({ message: 'Permission denied' })
        );
        consoleErrorSpy.mockRestore();
      });

      it('returns false when pin fails', async () => {
        vi.mocked(loadMessages).mockReturnValue({});
        vi.mocked(loadDeadlines).mockReturnValue([]);

        const newMessage = {
          id: 'msg777',
          pin: vi.fn().mockRejectedValue(new Error('Pin limit reached'))
        };
        const channel = makeChannel('channel123', 'due-dates');
        asMockChannel(channel).send.mockResolvedValue(newMessage);

        const guild = makeGuild([channel]);
        asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await updateDeadlineMessage(guild, 'channel123');

        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to update deadline message:',
          expect.objectContaining({ message: 'Pin limit reached' })
        );
        consoleErrorSpy.mockRestore();
      });
    });

    describe('edge cases', () => {
      it('handles deadlines with special characters in names', async () => {
        vi.mocked(loadMessages).mockReturnValue({});
        vi.mocked(loadDeadlines).mockReturnValue([
          makeDeadline({
            assignment: 'Quiz #2 (Part A&B)',
            courseChannelName: 'CS-101',
            dueDate: '2026-01-20T23:59:00.000Z',
            reminderLocationId: 'channel123'
          })
        ]);

        const newMessage = {
          id: 'msg888',
          pin: vi.fn().mockResolvedValue(undefined)
        };
        const channel = makeChannel('channel123', 'due-dates');
        asMockChannel(channel).send.mockResolvedValue(newMessage);

        const guild = makeGuild([channel]);
        asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

        const result = await updateDeadlineMessage(guild, 'channel123');

        expect(result).toBe(true);
        expect(asMockChannel(channel).send).toHaveBeenCalledWith(
          expect.stringContaining('Quiz #2 (Part A&B)')
        );
      });

      it('handles very long assignment names', async () => {
        const longName = 'A'.repeat(200);
        vi.mocked(loadMessages).mockReturnValue({});
        vi.mocked(loadDeadlines).mockReturnValue([
          makeDeadline({
            assignment: longName,
            courseChannelName: 'CS101',
            dueDate: '2026-01-20T23:59:00.000Z',
            reminderLocationId: 'channel123'
          })
        ]);

        const newMessage = {
          id: 'msg999',
          pin: vi.fn().mockResolvedValue(undefined)
        };
        const channel = makeChannel('channel123', 'due-dates');
        asMockChannel(channel).send.mockResolvedValue(newMessage);

        const guild = makeGuild([channel]);
        asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

        const result = await updateDeadlineMessage(guild, 'channel123');

        expect(result).toBe(true);
        expect(asMockChannel(channel).send).toHaveBeenCalledWith(
          expect.stringContaining(longName)
        );
      });

      it('preserves existing message IDs when replacing deleted message', async () => {
        vi.mocked(loadMessages).mockReturnValue({ 'other-channel': 'msg-old' });
        vi.mocked(loadDeadlines).mockReturnValue([]);

        const newMessage = {
          id: 'msg-new',
          pin: vi.fn().mockResolvedValue(undefined)
        };
        const channel = makeChannel('channel123', 'due-dates');
        asMockChannel(channel).send.mockResolvedValue(newMessage);

        const guild = makeGuild([channel]);
        asMockGuild(guild).channels.fetch.mockResolvedValue(channel);

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
