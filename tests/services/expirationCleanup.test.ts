import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import type { Client                                                        } from 'discord.js';
import * as storageHelpers                                          from '../../src/storage/storageHelpers.js';
import { purgeRemovedGuilds                                       } from '../../src/services/expirationCleanup.js';
import { cleanupExpiredDeadlines, startCleanupJob, stopCleanupJob } from '../../src/services/expirationCleanup.js';
import { loadDeadlines, saveDeadlines                             } from '../../src/storage/deadlineStorage.js';
import { getActiveDeadlines                                       } from '../../src/utils/expiration.js';
import type { Deadline                                            } from '../../src/types.js';
import { makeDeadline                                             } from '../helpers/interactions.js';

vi.mock('../../src/storage/deadlineStorage', () => ({
  loadDeadlines: vi.fn(),
  saveDeadlines: vi.fn(),
}));
vi.mock('../../src/utils/expiration', () => ({
  getActiveDeadlines: vi.fn(),
}));

const makeClient = (guilds = new Map<string, { id: string }>()): Client => (
  { guilds: { cache: guilds } } as unknown as Client
);

describe('expirationCleanup service', () => {
  const GUILD_ID = 'guild123';
  let consoleLogSpy: MockInstance;
  
  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    stopCleanupJob();
  });

  afterEach(() => {
    stopCleanupJob();
    consoleLogSpy.mockRestore();
  });

  describe('cleanupExpiredDeadlines', () => {
    it('removes expired deadlines and returns count', async () => {
      const mockDeadlines = [
        makeDeadline({ id: '1', assignment: 'Test 1', dueDate: '2026-01-20T23:59:00Z' }),
        makeDeadline({ id: '2', assignment: 'Test 2', dueDate: '2026-01-25T23:59:00Z' }),
      ];

      const active = [
        makeDeadline({ id: '2', assignment: 'Test 2', dueDate: '2026-01-25T23:59:00Z' }),
      ];

      vi.mocked(loadDeadlines).mockReturnValue(mockDeadlines);
      vi.mocked(getActiveDeadlines).mockReturnValue(active);

      const result = await cleanupExpiredDeadlines(GUILD_ID);
      
      expect(result.removed).toBe(1);
      expect(result.deadlineIds).toEqual(['1']);
      expect(saveDeadlines).toHaveBeenCalledWith(GUILD_ID, active);
    });

    it('returns zero when no deadlines are expired', async () => {
      const mockDeadlines = [makeDeadline({ id: '1' })];

      vi.mocked(loadDeadlines).mockReturnValue(mockDeadlines);
      vi.mocked(getActiveDeadlines).mockReturnValue(mockDeadlines);

      const result = await cleanupExpiredDeadlines(GUILD_ID);

      expect(result.removed).toBe(0);
      expect(result.deadlineIds).toEqual([]);
      expect(saveDeadlines).not.toHaveBeenCalled();
    });

    it('handles multiple expired deadlines', async () => {
      const all = [
        makeDeadline({ id: '1', assignment: 'Test 1' }),
        makeDeadline({ id: '2', assignment: 'Test 2' }),
        makeDeadline({ id: '3', assignment: 'Test 3' }),
      ];

      const active: Deadline[] = [];

      vi.mocked(loadDeadlines).mockReturnValue(all);
      vi.mocked(getActiveDeadlines).mockReturnValue(active);

      const result = await cleanupExpiredDeadlines(GUILD_ID);

      expect(result.removed).toBe(3);
      expect(result.deadlineIds).toEqual(['1', '2', '3']);
      expect(saveDeadlines).toHaveBeenCalledWith(GUILD_ID, active);
    });

    it('handles empty deadline list', async () => {
      vi.mocked(loadDeadlines).mockReturnValue([]);
      vi.mocked(getActiveDeadlines).mockReturnValue([]);

      const result = await cleanupExpiredDeadlines(GUILD_ID);

      expect(result.removed).toBe(0);
      expect(result.deadlineIds).toEqual([]);
      expect(saveDeadlines).not.toHaveBeenCalled();
    });
  });

  describe('startCleanupJob and stopCleanupJob', () => {
    beforeEach(() => vi.useFakeTimers());

    afterEach(() => {
      vi.useRealTimers();
      stopCleanupJob();
    });

    it('starts cleanup job with default interval', () => {
      startCleanupJob(makeClient());
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting expiration cleanup job (every 15 minutes)');
    });

    it('starts cleanup job with custom interval', () => {
      startCleanupJob(makeClient(), 30);
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting expiration cleanup job (every 30 minutes)');
    });

    it('does not start multiple cleanup jobs', () => {
      startCleanupJob(makeClient());
      startCleanupJob(makeClient());
      expect(consoleLogSpy).toHaveBeenCalledWith('Cleanup job already running');
    });

    it('stops cleanup job', () => {
      startCleanupJob(makeClient());
      stopCleanupJob();
      expect(consoleLogSpy).toHaveBeenCalledWith('Stopped expiration cleanup job');
    });

    it('runs cleanup at specified interval', async () => {
      const mockClient = makeClient(new Map([['A', { id: 'A' }], ['B', { id: 'B' }]]));

      vi.mocked(loadDeadlines).mockReturnValue([]);
      vi.mocked(getActiveDeadlines).mockReturnValue([]);

      startCleanupJob(mockClient, 1);

      vi.advanceTimersByTime(60000);
      await Promise.resolve();

      expect(loadDeadlines).toHaveBeenCalledWith('A');
      expect(loadDeadlines).toHaveBeenCalledWith('B');
    });
  });

  describe('purgeRemovedGuilds', () => {
    afterEach(() => { vi.restoreAllMocks(); });

    it('deletes data for guilds past the grace period', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(storageHelpers, 'getRemovedGuildsOlderThan').mockReturnValue(['g1', 'g2']);
      const deleteSpy = vi.spyOn(storageHelpers, 'deleteGuildData').mockImplementation(() => {});

      expect(purgeRemovedGuilds()).toBe(2);
      expect(deleteSpy).toHaveBeenCalledWith('g1');
      expect(deleteSpy).toHaveBeenCalledWith('g2');
      consoleLogSpy.mockRestore();
    });

    it('does nothing when no guilds are expired', () => {
      vi.spyOn(storageHelpers, 'getRemovedGuildsOlderThan').mockReturnValue([]);
      const deleteSpy = vi.spyOn(storageHelpers, 'deleteGuildData');

      expect(purgeRemovedGuilds()).toBe(0);
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });
});
