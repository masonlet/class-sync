const fs = require('fs');
const path = require('path');
const { loadDeadlines, saveDeadlines, DEADLINES_FILE } = require('../../storage/deadlineStorage');

jest.mock('fs');

describe('deadlineStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('loadDeadlines()', () => {
    it('loads and parses existing deadlines file', () => {
      const mockDeadlines = [
        { courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 1', date: '2026-01-01' }
      ];
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockDeadlines));

      const result = loadDeadlines();

      expect(fs.existsSync).toHaveBeenCalledWith(DEADLINES_FILE);
      expect(fs.readFileSync).toHaveBeenCalledWith(DEADLINES_FILE, 'utf8');
      expect(result).toEqual(mockDeadlines);
    }); 

    it('returns empty array when file does not exists', () => {
      fs.existsSync.mockReturnValue(false);

      const result = loadDeadlines();

      expect(result).toEqual([]);
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('returns empty array and logs error on read failure', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Read permission denied');
      });

      const result = loadDeadlines();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error loading deadlines:',
        expect.any(Error)
      );
    });

    it('returns empty array and logs error on JSON parse failure', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json{');

      const result = loadDeadlines();
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error loading deadlines:',
        expect.any(Error)
      );
    });
  });

  describe('saveDeadlines()', () => {
    it('writes deadlines to file with formatting', () => {
      const deadlines = [
        { courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 1', date: '2026-12-12' }
      ];

      saveDeadlines(deadlines);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        DEADLINES_FILE,
        JSON.stringify(deadlines, null, 2)
      );
    });

    it('logs error when write fails', () => {
      const deadlines = [];
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write permission denied');
      });

      saveDeadlines(deadlines);

      expect(console.error).toHaveBeenCalledWith(
        'Error saving deadlines:',
        expect.any(Error)
      );
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1); 
    });

    it('handles empty array', () => {
      saveDeadlines([]);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        DEADLINES_FILE,
        '[]'
      );
    });
  });
});
