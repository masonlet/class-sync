import { describe, it, expect } from 'vitest';

import { makeInteraction, makeCommandOptions } from '../helpers/interactions';

import { extractCommandInputs, validateChannelResolution, validateChannelFilter, findDeadline } from '../../src/utils/commandHelpers';

describe('commandHelpers', () => {
  describe('extractCommandInputs()', () => {
    it('calls Discord options API correctly', () => {
      const mockInteraction = makeInteraction({
        options: {
          course: 'INFO0001',
          assignment: 'Quiz1',
          date: '2026-01-01',
          cohort: { id: '0000000000000000001', name: 'Cohort A' }
        }
      });

      extractCommandInputs(mockInteraction);
 
      expect(mockInteraction.options.getString).toHaveBeenCalledWith('course');
      expect(mockInteraction.options.getString).toHaveBeenCalledWith('assignment');
      expect(mockInteraction.options.getString).toHaveBeenCalledWith('date');
      expect(mockInteraction.options.getRole).toHaveBeenCalledWith('cohort');
    });

    describe.each([
      [
        'all values provided',
        {
          course: 'INFO0001',
          assignment: 'Quiz1',
          date: '2026-01-01',
          cohort: { id: '0000000000000000001', name: 'Cohort A' }
        },
        {
          course: 'INFO0001',
          assignment: 'Quiz1',
          date: '2026-01-01',
          cohort: { id: '0000000000000000001', name: 'Cohort A' }
        }
      ],
      [
        'all null values',
        {},
        {
          course: null,
          assignment: null,
          date: null,
          cohort: null
        }
      ],
      [
        'mixed provided and null values',
        { 
          course: 'INFO0001', 
          assignment: 'Quiz1' 
        },
        {
          course: 'INFO0001',
          assignment: 'Quiz1',
          date: null,
          cohort: null
        }
      ]
    ])('extracts %s', (description, options, expected) => {
      it('returns correct output shape', () => {
        const mockInteraction = makeInteraction({ 
          options: makeCommandOptions(options) 
        });
        const result = extractCommandInputs(mockInteraction);
        expect(result).toEqual(expected);
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

    describe.each([
      [null, 'Channel not found.'],
      [undefined, 'Channel not found.'],
      ['DUPLICATE', 'Multiple channels found.']
    ])('validateChannelResolution(%p)', (input, expectedError) => {
      it(`returns error: "\${expectedError}"`, () => {
        const result = validateChannelResolution(input);
        expect(result).toEqual({
          valid: false,
          error: expectedError
        });
      });
    });
  });

  describe('validateChannelFilter()', () => {
    describe.each([
      [{ id: '0000000000000000001' }, true, undefined],
      [null, true, undefined],
      ['DUPLICATE', false, 'Multiple channels match your filter. Please be more specific.']
    ])('validateChannelFilter(%p)', (input, isValid, errorMsg) => {
      it(`returns valid: ${isValid}`, () => {
        const expected = isValid
          ? { valid: true }
          : { valid: false, error: errorMsg };
        const result = validateChannelFilter(input);
        expect(result).toEqual(expected);
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

    describe.each([
      ['no match found', { id: 'nah1' }, { id: 'nah2' }, 'nah3'],
      ['assignment does not match', { id: '1' }, { id: 'A' }, 'Wrong Assignment'],
      ['channel is null', null, { id: 'A' }, 'Quiz 1'],
      ['cohort is null', { id: '1' }, null, 'Quiz 1'],
      ['both channel and cohort are null', null, null, 'Quiz 1']
    ])('returns undefined when %s', (description, channel, cohort, assignment) => {
      it('returns undefined', () => {
        const result = findDeadline(mockDeadlines, channel, cohort, assignment);
        expect(result).toBeUndefined();
      });
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

    describe('edge cases', () => {
      it('handles deadlines with null property values', () => {
        const deadlines = [
          { courseChannelId: null, cohortId: 'A', assignment: 'Quiz 1', date: '2026-01-01' },
          { courseChannelId: '1', cohortId: null, assignment: 'Quiz 2', date: '2026-01-02' }
        ];
        const result = findDeadline(deadlines, { id: '1' }, { id: 'A' }, 'Quiz 1');
        expect(result).toBeUndefined();
      });

      it('handles case-sensitive assignment names', () => {
        const deadlines = [{ 
          courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 1', date: '2026-01-01' 
        }];
        const result = findDeadline(deadlines, { id: '1' }, { id: 'A' }, 'quiz 1');
        expect(result).toBeUndefined();
      });

      it('distinguishes between similar assignment names', () => {
        const deadlines = [
          { courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 1', date: '2026-01-01' },
          { courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 10', date: '2026-01-02' },
          { courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 1 Retake', date: '2026-01-03' }
        ];
        const result = findDeadline(deadlines, { id: '1' }, { id: 'A' }, 'Quiz 1');
        expect(result).toEqual(deadlines[0]);
        expect(result.assignment).toBe('Quiz 1');
      });

      it('handles objects without id property', () => {
        const deadlines = [{ 
          courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 1', date: '2026-01-01' 
        }];
        const result = findDeadline(deadlines, {}, { id: 'A' }, 'Quiz 1');
        expect(result).toBeUndefined();
      });
    });
  });
});
