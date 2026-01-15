const fs = require('fs');
const { loadMessages, saveMessages } = require('../../storage/messageStorage');
const { getGuildDataPath } = require('../../storage/utils');

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
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockMessages));
      expect(loadMessages(GUILD_ID)).toEqual(mockMessages);
      expect(fs.existsSync).toHaveBeenCalledWith(messagesFile);
      expect(fs.readFileSync).toHaveBeenCalledWith(messagesFile, 'utf8');
    });

    it('returns empty object when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      expect(loadMessages(GUILD_ID)).toEqual({});
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('returns empty object and logs error on read failure', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Read permission denied');
      });
      expect(loadMessages(GUILD_ID)).toEqual({});
      expect(console.error).toHaveBeenCalledWith(
        'Error loading message tracking:',
        expect.any(Error)
      );
    });

    it('returns empty object and logs error on JSON parse failure', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json{');
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
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        messagesFile,
        JSON.stringify(messages, null, 2)
      );
    });

    it('logs error when write fails', () => {
      const messages = {};
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write permission denied');
      });

      saveMessages(GUILD_ID, messages);

      expect(console.error).toHaveBeenCalledWith(
        'Error saving message tracking:',
        expect.any(Error)
      );
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('handles empty object', () => {
      const messagesFile = getGuildDataPath(GUILD_ID, 'messages.json');
      saveMessages(GUILD_ID, {});
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        messagesFile,
        '{}'
      );
    });
  });
});
