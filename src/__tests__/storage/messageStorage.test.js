const fs = require('fs');
const path = require('path');
const { loadMessages, saveMessages, MESSAGES_FILE } = require('../../storage/messageStorage');

jest.mock('fs');

describe('messageStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('loadMessages()', () => {
    it('loads and parses existing messages file', () => {
      const mockMessages = {
        '123': { messageId: 'msg1', channelId: 'ch1' }
      };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockMessages));

      const result = loadMessages();

      expect(fs.existsSync).toHaveBeenCalledWith(MESSAGES_FILE);
      expect(fs.readFileSync).toHaveBeenCalledWith(MESSAGES_FILE, 'utf8');
      expect(result).toEqual(mockMessages);
    });

    it('returns empty object when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      const result = loadMessages();

      expect(result).toEqual({});
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('returns empty object and logs error on read failure', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Read permission denied');
      });

      const result = loadMessages();

      expect(result).toEqual({});
      expect(console.error).toHaveBeenCalledWith(
        'Error loading message tracking:',
        expect.any(Error)
      );
    });

    it('returns empty object and logs error on JSON parse failure', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json{');

      const result = loadMessages();

      expect(result).toEqual({});
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

      saveMessages(messages);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        MESSAGES_FILE,
        JSON.stringify(messages, null, 2)
      );
    });

    it('logs error when write fails', () => {
      const messages = {};
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write permission denied');
      });

      saveMessages(messages);

      expect(console.error).toHaveBeenCalledWith(
        'Error saving message tracking:',
        expect.any(Error)
      );
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('handles empty object', () => {
      saveMessages({});

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        MESSAGES_FILE,
        '{}'
      );
    });
  });
});
