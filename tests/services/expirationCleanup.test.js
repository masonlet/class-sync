import { cleanupExpiredDeadlines, startCleanupJob, stopCleanupJob } from '../../src/services/expirationCleanup';
import { loadDeadlines, saveDeadlines } from '../../src/storage/deadlineStorage';
import { getActiveDeadlines } from '../../src/utils/expiration';

jest.mock('../../src/storage/deadlineStorage', () => ({
  loadDeadlines: jest.fn(),
  saveDeadlines: jest.fn(),
}));
jest.mock('../../src/utils/expiration', () => ({
  getActiveDeadlines: jest.fn(),
}));

describe('expirationCleanup service', () => {
  const GUILD_ID = 'guild123';
  let consoleLogSpy;
  
  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    stopCleanupJob();
  });

  afterEach(() => {
    stopCleanupJob();
    consoleLogSpy.mockRestore();
  });

  describe('cleanupExpiredDeadlines', () => {
    it('removes expired deadlines and returns count', async () => {
      const mockDeadlines = [
        { id: '1', assignment: 'Test 1', dueDate: '2026-01-20T23:59:00Z' },
        { id: '2', assignment: 'Test 2', dueDate: '2026-01-25T23:59:00Z' },
      ];

      const active = [
        { id: '2', assignment: 'Test 2', dueDate: '2026-01-25T23:59:00Z' },
      ];

      loadDeadlines.mockReturnValue(mockDeadlines);
      getActiveDeadlines.mockReturnValue(active);

      const result = await cleanupExpiredDeadlines(GUILD_ID);
      
      expect(result.removed).toBe(1);
      expect(result.deadlineIds).toEqual(['1']);
      expect(saveDeadlines).toHaveBeenCalledWith(GUILD_ID, active);
    });

    it('returns zero when no deadlines are expired', async () => {
      const mockDeadlines = [{ id: '1' }];

      loadDeadlines.mockReturnValue(mockDeadlines);
      getActiveDeadlines.mockReturnValue(mockDeadlines);

      const result = await cleanupExpiredDeadlines(GUILD_ID);

      expect(result.removed).toBe(0);
      expect(result.deadlineIds).toEqual([]);
      expect(saveDeadlines).not.toHaveBeenCalled();
    });

    it('handles multiple expired deadlines', async () => {
      const mockExpired = [
        { id: '1', assignment: 'Test 1' },
        { id: '2', assignment: 'Test 2' },
        { id: '3', assignment: 'Test 3' },
      ];

      getAllDeadlines.mockReturnValue(mockExpired);
      getExpiredDeadlines.mockReturnValue(mockExpired);

      const result = await cleanupExpiredDeadlines();

      expect(result.removed).toBe(3);
      expect(result.deadlineIds).toEqual(['1', '2', '3']);
      expect(removeDeadline).toHaveBeenCalledTimes(3);
    });

    it('handles empty deadline list', async () => {
      loadDeadlines.mockReturnValue([]);
      getActiveDeadlines.mockReturnValue([]);

      const result = await cleanupExpiredDeadlines(GUILD_ID);

      expect(result.removed).toBe(0);
      expect(result.deadlineIds).toEqual([]);
      expect(removeDeadline).not.toHaveBeenCalled();
    });
  });

  describe('startCleanupJob and stopCleanupJob', () => {
    beforeEach(() => jest.useFakeTimers());

    afterEach(() => {
      jest.useRealTimers();
      stopCleanupJob();
    });

    it('starts cleanup job with default interval', () => {
      startCleanupJob();
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting expiration cleanup job (every 15 minutes)');
    });

    it('starts cleanup job with custom interval', () => {
      startCleanupJob(30);
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting expiration cleanup job (every 30 minutes)');
    });

    it('does not start multiple cleanup jobs', () => {
      startCleanupJob();
      startCleanupJob();
      expect(consoleLogSpy).toHaveBeenCalledWith('Cleanup job already running');
    });

    it('stops cleanup job', () => {
      startCleanupJob();
      stopCleanupJob();
      expect(consoleLogSpy).toHaveBeenCalledWith('Stopped expiration cleanup job');
    });

    it('runs cleanup at specified interval', async () => {
      const guildA = { id: 'A' };
      const guildB = { id: 'B' };

      const mockClient = {
        guilds: { cache: new Map([['A', guildA], ['B', guildB]]) }
      };

      loadDeadlines.mockReturnValue([]);
      getActiveDeadlines.mockReturnValue([]);

      startCleanupJob(1); 

      jest.advanceTimersByTime(60000); 
      await Promise.resolve();

      expect(loadDeadlines).toHaveBeenCalledWith('A');
      expect(loadDeadlines).toHaveBeenCalledWith('B');
    });
  });
});
