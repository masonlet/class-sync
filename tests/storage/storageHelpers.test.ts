import { describe, it, expect, vi, beforeEach                                    } from 'vitest';
import { existsSync, mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join                                                                    } from 'path';
import {
  getGuildDataPath,
  ensureGuildDir,
  deleteGuildData,
  markGuildRemoved,
  clearGuildRemoved,
  getRemovedGuildsOlderThan,
  DATA_DIR
} from '../../src/storage/storageHelpers.js';

vi.mock('fs');

describe('storage utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
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
      expect(() => getGuildDataPath(null as unknown as string, 'deadlines.json')).toThrow('guildId is required');
    });

    it('throws error when guildId is undefined', () => {
      expect(() => getGuildDataPath(undefined as unknown as string, 'deadlines.json')).toThrow('guildId is required');
    });

    it('throws error when guildId is empty string', () => {
      expect(() => getGuildDataPath('', 'deadlines.json')).toThrow('guildId is required');
    });

    it('throws error when filename is null', () => {
      expect(() => getGuildDataPath('123456789', null as unknown as string)).toThrow('filename is required');
    });

    it('throws error when filename is undefined', () => {
      expect(() => getGuildDataPath('123456789', undefined as unknown as string)).toThrow('filename is required');
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
      vi.mocked(existsSync).mockReturnValue(false);
      
      ensureGuildDir('123456789');
      
      expect(existsSync).toHaveBeenCalledWith(join(DATA_DIR, '123456789'));
      expect(mkdirSync).toHaveBeenCalledWith(
        join(DATA_DIR, '123456789'),
        { recursive: true }
      );
    });

    it('does not create directory when it already exists', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      
      ensureGuildDir('123456789');
      
      expect(existsSync).toHaveBeenCalledWith(join(DATA_DIR, '123456789'));
      expect(mkdirSync).not.toHaveBeenCalled();
    });

    it('handles different guild IDs', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      
      ensureGuildDir('987654321');
      
      expect(mkdirSync).toHaveBeenCalledWith(
        join(DATA_DIR, '987654321'),
        { recursive: true }
      );
    });

    it('throws error when guildId is null', () => {
      expect(() => ensureGuildDir(null as unknown as string)).toThrow('guildId is required');
    });

    it('throws error when guildId is undefined', () => {
      expect(() => ensureGuildDir(undefined as unknown as string)).toThrow('guildId is required');
    });

    it('throws error when guildId is empty string', () => {
      expect(() => ensureGuildDir('' as unknown as string)).toThrow('guildId is required');
    });
  });

  describe('deleteGuildData()', () => {
    it('removes the guild directory recursively', () => {
      deleteGuildData('123456789');
      expect(rmSync).toHaveBeenCalledWith(
        join(DATA_DIR, '123456789'),
        { recursive: true, force: true }
      );
    });

    it('throws error when guildId is empty string', () => {
      expect(() => deleteGuildData('')).toThrow('guildId is required');
    });
  });

  describe('markGuildRemoved()', () => {
    it('writes removal marker when guild dir exists', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.spyOn(Date, 'now').mockReturnValue(1000000);

      markGuildRemoved('123456789');

      expect(writeFileSync).toHaveBeenCalledWith(
        join(DATA_DIR, '123456789', 'removed.json'),
        JSON.stringify({ removedAt: 1000000 }, null, 2)
      );
    });

    it('does nothing when guild dir does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      markGuildRemoved('123456789');
      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it('throws error when guildId is empty string', () => {
      expect(() => markGuildRemoved('')).toThrow('guildId is required');
    });
  });

  describe('clearGuildRemoved()', () => {
    it('removes the marker file', () => {
      clearGuildRemoved('123456789');
      expect(rmSync).toHaveBeenCalledWith(
        join(DATA_DIR, '123456789', 'removed.json'),
        { force: true }
      );
    });

    it('throws error when guildId is empty string', () => {
      expect(() => clearGuildRemoved('')).toThrow('guildId is required');
    });
  });

  describe('getRemovedGuildsOlderThan()', () => {
    it('returns empty array when data dir does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false);
      expect(getRemovedGuildsOlderThan(1000)).toEqual([]);
    });

    it('returns only guilds whose marker is older than maxAge', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readdirSync).mockReturnValue(['old-guild', 'new-guild'] as never);
      vi.spyOn(Date, 'now').mockReturnValue(10000);
      vi.mocked(readFileSync).mockImplementation((path) =>
        String(path).includes('old-guild')
          ? JSON.stringify({ removedAt: 1000 })
          : JSON.stringify({ removedAt: 9500 })
      );

      expect(getRemovedGuildsOlderThan(5000)).toEqual(['old-guild']);
    });

    it('skips guilds without a marker', () => {
      vi.mocked(existsSync).mockImplementation((path) =>
        String(path) === DATA_DIR
      );
      vi.mocked(readdirSync).mockReturnValue(['guild-a'] as never);

      expect(getRemovedGuildsOlderThan(1000)).toEqual([]);
      expect(readFileSync).not.toHaveBeenCalled();
    });

    it('logs and skips guilds with unreadable markers', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readdirSync).mockReturnValue(['bad-guild'] as never);
      vi.mocked(readFileSync).mockReturnValue('not json');

      expect(getRemovedGuildsOlderThan(1000)).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
