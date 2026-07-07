import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockFs, resetMocks, mockFileExistsWithJson, mockFileMissing, mockReadError, mockParseError, mockWriteError, expectWriteFormatted } from '../helpers/fsMocks';
import { expectEmptyAndLoggedError } from '../helpers/assertions';
import { loadMessages, saveMessages } from '../../src/storage/messageStorage';
import { getGuildDataPath } from '../../src/storage/storageHelpers';

describe('messageStorage', () => {
  const GUILD_ID = '123456789';

  beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
  });

  describe('loadMessages()', () => {
    it('loads and parses existing messages file', () => {
      const mockMessages = { '123': 'msg1' };
      const messagesFile = getGuildDataPath(GUILD_ID, 'messages.json');
      mockFileExistsWithJson(mockMessages);
      expect(loadMessages(GUILD_ID)).toEqual(mockMessages);
      expect(mockFs.existsSync).toHaveBeenCalledWith(messagesFile);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(messagesFile, 'utf8');
    });
    it('returns empty object when file does not exist', () => {
      mockFileMissing();
      expect(loadMessages(GUILD_ID)).toEqual({});
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });
    it('returns empty object and logs error on read failure', () => {
      mockReadError('Read permission denied');
      expectEmptyAndLoggedError(() => loadMessages(GUILD_ID), 'Error loading message tracking', {});
    });
    it('returns empty object and logs error on JSON parse failure', () => {
      mockParseError();
      expectEmptyAndLoggedError(() => loadMessages(GUILD_ID), 'Error loading message tracking', {});
    });
  });

  describe('saveMessages()', () => {
    it('writes messages to file with formatting', () => {
      const messages = { '123': 'msg1' };
      const messagesFile = getGuildDataPath(GUILD_ID, 'messages.json');
      saveMessages(GUILD_ID, messages);
      expectWriteFormatted(messagesFile, messages);
    });
    it('logs error when write fails', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        mockWriteError('Write permission denied');
        saveMessages(GUILD_ID, {});
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error saving message tracking:',
          expect.any(Error)
        );
        expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });
    it('handles empty object', () => {
      const messagesFile = getGuildDataPath(GUILD_ID, 'messages.json');
      saveMessages(GUILD_ID, {});
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(messagesFile, '{}');
    });
  });
});
