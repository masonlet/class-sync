const { 
  extractCommandInputs, 
  validateChannelResolution,
  validateChannelFilter,
  findDeadline 
} = require('../../utils/commandHelpers');

describe('commandHelpers', () => {
  describe('extractCommandInputs()', () => {
    it('extracts all command options from interaction', () => {
      const mockInteraction = {
        options: {
          getString: jest.fn((key) => {
            const values = { 
              course: 'INFO0001', 
              assignment: 'Quiz1', 
              date: '2026-01-15' 
            };
            return values[key];
          }),
          getRole: jest.fn(() => ({ 
            id: '0000000000000000001', 
            name: 'Cohort A' 
          }))
        }
      };

      const result = extractCommandInputs(mockInteraction);
      expect(result).toEqual({
        courseInput: 'INFO0001',
        cohort: { id: '0000000000000000001', name: 'Cohort A' },
        assignment: 'Quiz1',
        dateInput: '2026-01-15'
      });

      expect(mockInteraction.options.getString).toHaveBeenCalledWith('course');
      expect(mockInteraction.options.getString).toHaveBeenCalledWith('assignment');
      expect(mockInteraction.options.getString).toHaveBeenCalledWith('date');
      expect(mockInteraction.options.getRole).toHaveBeenCalledWith('cohort');
    });

    it('handles all null values', () => {
      const mockInteraction = {
        options: {
          getString: jest.fn(() => null),
          getRole: jest.fn(() => null)
        }
      };

      const result = extractCommandInputs(mockInteraction);
      expect(result).toEqual({
        courseInput: null,
        cohort: null,
        assignment: null,
        dateInput: null
      });
    });

    it('handles mixed provided and null values', () => {
      const mockInteraction = {
        options: {
          getString: jest.fn((key) => {
            return { course: 'CS101', assignment: 'HW1', date: null }[key];
          }),
          getRole: jest.fn(() => null)
        }
      };

      const result = extractCommandInputs(mockInteraction);
      expect(result).toEqual({
        courseInput: 'CS101',
        cohort: null,
        assignment: 'HW1',
        dateInput: null
      });
    });
  });

  describe('validateChannelResolution()', () => {
    it('returns valid for existing channel', () => {
      const channel = { id: '0000000000000000001', name: 'general' };
      const result = validateChannelResolution(channel);
      expect(result).toEqual({
        valid: true 
      });
    });

    it('returns error for null channel', () => {
      const result = validateChannelResolution(null);
      expect(result).toEqual({ 
        valid: false, 
        error: 'Channel not found.'
      });
    });

    it('returns error for undefined channel', () => {
      const result = validateChannelResolution(undefined);
      expect(result).toEqual({ 
        valid: false, 
        error: 'Channel not found.'
      });
    });

    it('returns error for DUPLICATE channel', () => {
      const result = validateChannelResolution("DUPLICATE");
      expect(result).toEqual({ 
        valid: false, 
        error: 'Multiple channels found.' 
      });
    });
  });

  describe('validateChannelFilter()', () => {
    it('returns valid for non-duplicate channel', () => {
      const result = validateChannelFilter({ 
        id: '0000000000000000001' 
      });
      expect(result).toEqual({ valid: true });
    });

    it('returns valid for null channel', () => {
      const result = validateChannelFilter(null);
      expect(result).toEqual({ valid: true });
    });

    it('returns error for DUPLICATE channel', () => {
      const result = validateChannelFilter("DUPLICATE");
      expect(result).toEqual({
        valid: false,
        error: 'Multiple channels match your filter. Please be more specific.'
      });
    }); 
  });

  describe('findDeadline()', () => {
    const mockDeadlines = [
      { courseChannelId: '0', cohortId: 'A', assignment: 'Quiz 1', date: '2026-01-14' },
      { courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 1', date: '2026-01-15' },
      { courseChannelId: '1', cohortId: 'B', assignment: 'Quiz 1', date: '2026-01-16' },
      { courseChannelId: '2', cohortId: 'A', assignment: 'Quiz 2', date: '2026-01-17' }
    ];

    it('finds matching deadline', () => {
      const channel = { id: '0' };
      const cohort = { id: 'A' };
      const assignment = 'Quiz 1';

      const result = findDeadline(mockDeadlines, channel, cohort, assignment);
      expect(result).toEqual(mockDeadlines[0]);
    });

    it('returns undefined when no match found', () => {
      const channel = { id: 'nah1' };
      const cohort = { id: 'nah2' };
      const assignment = 'nah3';

      const result = findDeadline(mockDeadlines, channel, cohort, assignment);
      expect(result).toBeUndefined();
    });

    it('returns undefined when assignment does not match', () => {
      const channel = { id: '1' };
      const cohort = { id: 'A' };

      const result = findDeadline(mockDeadlines, channel, cohort, 'Wrong Assignment');
      expect(result).toBeUndefined();
    });

    it('distinguishes between different cohorts', () => {
      const channel = { id: '1' };
      const cohort = { id: 'B' };
      const assignment = 'Quiz 1';

      const result = findDeadline(mockDeadlines, channel, cohort, assignment);
      expect(result).toEqual(mockDeadlines[2]);
    });

    it('distinguishes between different assignments', () => {
      const channel = { id: '2' };
      const cohort = { id: 'A' };
      const assignment = 'Quiz 2';

      const result = findDeadline(mockDeadlines, channel, cohort, assignment);
      expect(result).toEqual(mockDeadlines[3]);
    });

    it('handles empty deadlines array', () => {
      const channel = { id: '1' };
      const cohort = { id: 'A' };
      const assignment = 'Quiz 1';

      const result = findDeadline([], channel, cohort, assignment);
      expect(result).toBeUndefined();
    });

    it('handles deadlines array with null entries', () => {
      const deadlinesWithNulls = [
        null,
        { courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 1', date: '2026-01-15' },
        undefined,
        { courseChannelId: '2', cohortId: 'B', assignment: 'Quiz 2', date: '2026-01-16' }
      ];
      const channel = { id: '1' };
      const cohort = { id: 'A' };
      const assignment = 'Quiz 1';

      const result = findDeadline(deadlinesWithNulls, channel, cohort, assignment);
      expect(result).toEqual(deadlinesWithNulls[1]);
    });

    it('returns undefined when channel is null', () => {
      const result = findDeadline(mockDeadlines, null, { id: 'A' }, 'Quiz 1');
      expect(result).toBeUndefined();
    });

    it('returns undefined when cohort is null', () => {
      const result = findDeadline(mockDeadlines, { id: '1' }, null, 'Quiz 1');
      expect(result).toBeUndefined();
    });

    it('returns undefined when both channel and cohort are null', () => {
      const result = findDeadline(mockDeadlines, null, null, 'Quiz 1');
      expect(result).toBeUndefined();
    });
  });
});
