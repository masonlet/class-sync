import { existsSync, readFileSync, writeFileSync } from 'fs';

import { loadMessages, saveMessages } from '../../src/storage/messageStorage';
import { getGuildDataPath } from '../../src/storage/utils';

jest.mock('fs');

describe('messageStorage', () => {
  const GUILD_ID = '123456789';

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('loadMessages()', () => {
    it('loads and parses existing messages file', () => {
      const mockMessages = {
        '123': { messageId: 'msg1', channelId: 'ch1' }
      };
      const messagesFile = getGuildDataPath(GUILD_ID, 'messages.json');
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(mockMessages));
      expect(loadMessages(GUILD_ID)).toEqual(mockMessages);
      expect(existsSync).toHaveBeenCalledWith(messagesFile);
      expect(readFileSync).toHaveBeenCalledWith(messagesFile, 'utf8');
    });

    it('returns empty object when file does not exist', () => {
      existsSync.mockReturnValue(false);
      expect(loadMessages(GUILD_ID)).toEqual({});
      expect(readFileSync).not.toHaveBeenCalled();
    });

    it('returns empty object and logs error on read failure', () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockImplementation(() => {
        throw new Error('Read permission denied');
      });
      expect(loadMessages(GUILD_ID)).toEqual({});
      expect(console.error).toHaveBeenCalledWith(
        'Error loading message tracking:',
        expect.any(Error)
      );
    });

    it('returns empty object and logs error on JSON parse failure', () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue('invalid json{');
      expect(loadMessages(GUILD_ID)).toEqual({});
      expect(console.error).toHaveBeenCalledWith(
        'Error loading message tracking:',
        expect.any(Error)
      );
    });
  });

  describe('saveMessages()', () => {
    it('writes messages to file with formatting', () => {
      const messages = {
        '123': { messageId: 'msg1', channelId: 'ch1' }
      };
      const messagesFile = getGuildDataPath(GUILD_ID, 'messages.json');
      saveMessages(GUILD_ID, messages);
      expect(writeFileSync).toHaveBeenCalledWith(
        messagesFile,
        JSON.stringify(messages, null, 2)
      );
    });

    it('logs error when write fails', () => {
      const messages = {};
      writeFileSync.mockImplementation(() => {
        throw new Error('Write permission denied');
      });

      saveMessages(GUILD_ID, messages);

      expect(console.error).toHaveBeenCalledWith(
        'Error saving message tracking:',
        expect.any(Error)
      );
      expect(writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('handles empty object', () => {
      const messagesFile = getGuildDataPath(GUILD_ID, 'messages.json');
      saveMessages(GUILD_ID, {});
      expect(writeFileSync).toHaveBeenCalledWith(
        messagesFile,
        '{}'
      );
    });
  });
});
