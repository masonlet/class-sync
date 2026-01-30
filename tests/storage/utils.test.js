import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import { getGuildDataPath, ensureGuildDir, DATA_DIR } from '../../src/storage/utils';

jest.mock('fs');

describe('storage utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGuildDataPath()', () => {
    it('builds correct path for guild and filename', () => {
      const result = getGuildDataPath('123456789', 'deadlines.json');
      expect(result).toBe(join(DATA_DIR, '123456789', 'deadlines.json'));
    });

    it('handles different guild IDs', () => {
      const result = getGuildDataPath('987654321', 'messages.json');
      expect(result).toBe(join(DATA_DIR, '987654321', 'messages.json'));
    });

    it('handles different filenames', () => {
      const result = getGuildDataPath('111222333', 'config.json');
      expect(result).toBe(join(DATA_DIR, '111222333', 'config.json'));
    });

    it('throws error when guildId is null', () => {
      expect(() => getGuildDataPath(null, 'deadlines.json')).toThrow('guildId is required');
    });

    it('throws error when guildId is undefined', () => {
      expect(() => getGuildDataPath(undefined, 'deadlines.json')).toThrow('guildId is required');
    });

    it('throws error when guildId is empty string', () => {
      expect(() => getGuildDataPath('', 'deadlines.json')).toThrow('guildId is required');
    });

    it('throws error when filename is null', () => {
      expect(() => getGuildDataPath('123456789', null)).toThrow('filename is required');
    });

    it('throws error when filename is undefined', () => {
      expect(() => getGuildDataPath('123456789', undefined)).toThrow('filename is required');
    });

    it('throws error when filename is empty string', () => {
      expect(() => getGuildDataPath('123456789', '')).toThrow('filename is required');
    });

    it('throws error when filename contains forward slash', () => {
      expect(() => getGuildDataPath('123456789', 'foo/bar.json')).toThrow('Invalid filename');
    });

    it('throws error when filename contains backslash', () => {
      expect(() => getGuildDataPath('123456789', 'foo\\bar.json')).toThrow('Invalid filename');
    });

    it('throws error when filename contains path traversal', () => {
      expect(() => getGuildDataPath('123456789', '../secrets.json')).toThrow('Invalid filename');
    });
  });

  describe('ensureGuildDir()', () => {
    it('creates directory when it does not exist', () => {
      existsSync.mockReturnValue(false);
      
      ensureGuildDir('123456789');
      
      expect(existsSync).toHaveBeenCalledWith(join(DATA_DIR, '123456789'));
      expect(mkdirSync).toHaveBeenCalledWith(
        join(DATA_DIR, '123456789'),
        { recursive: true }
      );
    });

    it('does not create directory when it already exists', () => {
      existsSync.mockReturnValue(true);
      
      ensureGuildDir('123456789');
      
      expect(existsSync).toHaveBeenCalledWith(join(DATA_DIR, '123456789'));
      expect(mkdirSync).not.toHaveBeenCalled();
    });

    it('handles different guild IDs', () => {
      existsSync.mockReturnValue(false);
      
      ensureGuildDir('987654321');
      
      expect(mkdirSync).toHaveBeenCalledWith(
        join(DATA_DIR, '987654321'),
        { recursive: true }
      );
    });

    it('throws error when guildId is null', () => {
      expect(() => ensureGuildDir(null)).toThrow('guildId is required');
    });

    it('throws error when guildId is undefined', () => {
      expect(() => ensureGuildDir(undefined)).toThrow('guildId is required');
    });

    it('throws error when guildId is empty string', () => {
      expect(() => ensureGuildDir('')).toThrow('guildId is required');
    });
  });
});
