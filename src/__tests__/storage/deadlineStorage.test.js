const { mockFs, resetMocks, mockFileExistsWithJson, mockReadError, mockParseError, mockWriteError, expectWriteFormatted } = require('../helpers/fsMocks');
const { loadDeadlines, saveDeadlines, DEADLINES_FILE } = require('../../storage/deadlineStorage');
const { expectEmptyAndLoggedError } = require('../helpers/assertions');

beforeEach(() => {
  jest.clearAllMocks();
  resetMocks();
});

describe('deadlineStorage', () => {
  describe('loadDeadlines()', () => {
    it('loads and parses existing deadlines file', () => {
      const mockDeadlines = [{ 
        courseChannelId: '1', 
        cohortId: 'A',
        assignment: 'Quiz 1', 
        date: '2026-01-01' 
      }];
      mockFileExistsWithJson(DEADLINES_FILE, mockDeadlines);
      expect(loadDeadlines()).toEqual(mockDeadlines);
    }); 

    it('returns empty array when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      const result = loadDeadlines();
      expect(result).toEqual([]);
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it('returns empty array and logs error on read failure', () => {
      mockReadError('permission denied');
      expectEmptyAndLoggedError(loadDeadlines, 'Error loading deadlines');      
    });

    it('returns empty array and logs error on JSON parse failure', () => {
      mockParseError();
      expectEmptyAndLoggedError(loadDeadlines, 'Error loading deadlines');
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
        mockFileExistsWithJson(DEADLINES_FILE, deadlines);

        const result = loadDeadlines();
        expect(result[0].extraField).toBe('preserved');
      });

      it('handles malformed deadline objects', () => {
        const badDeadlines = [ 
          null,
          {},
          { courseChannelId: '1' },
          { courseChannelId: '2', cohortId: 'B', assignment: 'valid', date: '2026-01-01' }
        ];
        mockFileExistsWithJson(DEADLINES_FILE, badDeadlines);
        const result = loadDeadlines();
        expect(result).toHaveLength(4);
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
        mockFileExistsWithJson(DEADLINES_FILE, largeDeadlines);
        const result = loadDeadlines();
        expect(result).toHaveLength(5000);
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
      saveDeadlines(deadlines);
      expectWriteFormatted(DEADLINES_FILE, deadlines);
    });

    it('logs error when write fails', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      try {
        mockWriteError('disk full');
        saveDeadlines([]);
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
      saveDeadlines([]);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        DEADLINES_FILE,
        '[]'
      );
    });
  });
});
