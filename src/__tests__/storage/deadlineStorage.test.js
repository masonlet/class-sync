const { mockFs, resetMocks, mockFileExistsWithJson, mockReadError, mockParseError, mockWriteError, expectWriteFormatted } = require('../helpers/fsMocks');
const { loadDeadlines, saveDeadlines } = require('../../storage/deadlineStorage');
const { expectEmptyAndLoggedError } = require('../helpers/assertions');
const { getGuildDataPath } = require('../../storage/utils');

describe('deadlineStorage', () => {
  const GUILD_ID = '123456789';

  beforeEach(() => {
    jest.clearAllMocks();
    resetMocks();
  });

  describe('loadDeadlines()', () => {
    it('loads and parses existing deadlines file', () => {
      const mockDeadlines = [{ 
        courseChannelId: '1', 
        cohortId: 'A',
        assignment: 'Quiz 1', 
        date: '2026-01-01' 
      }];
      const deadlinesFile = getGuildDataPath(GUILD_ID, 'deadlines.json');
      mockFileExistsWithJson(deadlinesFile, mockDeadlines);
      expect(loadDeadlines(GUILD_ID)).toEqual(mockDeadlines);
    }); 

    it('returns empty array when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      expect(loadDeadlines(GUILD_ID)).toEqual([]);
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it('returns empty array and logs error on read failure', () => {
      mockReadError('permission denied');
      expectEmptyAndLoggedError(() => loadDeadlines(GUILD_ID), 'Error loading deadlines');      
    });

    it('returns empty array and logs error on JSON parse failure', () => {
      mockParseError();
      expectEmptyAndLoggedError(() => loadDeadlines(GUILD_ID), 'Error loading deadlines');
    });

    describe('data integrity', () => {
      it('handles deadlines with extra fields preserved', () => {
        const deadlines = [{
          courseChannelId: '1',
          cohortId: 'A',
          assignment: 'Quiz 1',
          date: '2026-01-01',
          extraField: 'preserved'
        }];
        const deadlinesFile = getGuildDataPath(GUILD_ID, 'deadlines.json');
        mockFileExistsWithJson(deadlinesFile, deadlines);
        expect(loadDeadlines(GUILD_ID)[0].extraField).toBe('preserved');
      });

      it('handles malformed deadline objects', () => {
        const badDeadlines = [ 
          null,
          {},
          { courseChannelId: '1' },
          { courseChannelId: '2', cohortId: 'B', assignment: 'valid', date: '2026-01-01' }
        ];
        const deadlinesFile = getGuildDataPath(GUILD_ID, 'deadlines.json');
        mockFileExistsWithJson(deadlinesFile, badDeadlines);
        expect(loadDeadlines(GUILD_ID)).toHaveLength(4);
      });

      it('handles very large deadline arrays', () => {
        const largeDeadlines = [];
        for (let i = 0; i < 5000; i++) {
          largeDeadlines.push({
            courseChannelId: `course${i}`,
            cohortId: `cohort${i % 10}`,
            assignment: `Assignment ${i}`,
            date: `2026-01-01`  
          });
        }
        const deadlinesFile = getGuildDataPath(GUILD_ID, 'deadlines.json');
        mockFileExistsWithJson(deadlinesFile, largeDeadlines);
        expect(loadDeadlines(GUILD_ID)).toHaveLength(5000);
      });
    });
  });

  describe('saveDeadlines()', () => {
    it('writes deadlines to file with formatting', () => {
      const deadlines = [{ 
        courseChannelId: '1', 
        cohortId: 'A', 
        assignment: 'Quiz 1', 
        date: '2026-12-12' 
      }];
     const deadlinesFile = getGuildDataPath(GUILD_ID, 'deadlines.json');
      saveDeadlines(GUILD_ID, deadlines);
      expectWriteFormatted(deadlinesFile, deadlines);
    });

    it('logs error when write fails', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      try {
        mockWriteError('disk full');
        saveDeadlines(GUILD_ID, []);
        expect(console.error).toHaveBeenCalledWith(
          'Error saving deadlines:',
          expect.any(Error)
        );
        expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1); 
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it('handles empty array', () => {
      const deadlinesFile = getGuildDataPath(GUILD_ID, 'deadlines.json');
      saveDeadlines(GUILD_ID, []);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        deadlinesFile,
        '[]'
      );
    });
  });
});
