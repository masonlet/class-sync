import { describe, it, expect } from 'vitest';
import { makeInteraction, makeCommandOptions, makeDeadline } from '../helpers/interactions';
import { extractCommandInputs, isValidChannel, isValidChannelFilter, findDeadline } from '../../src/utils/commandHelpers';
import type { Channel } from '../../src/types';
import type { Role } from 'discord.js';

const asChannel = (value: unknown): Channel => value as Channel;
const asRole = (value: unknown): Role => value as Role;

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
 
      expect(mockInteraction.options.getString).toHaveBeenCalledWith('course', true);
      expect(mockInteraction.options.getString).toHaveBeenCalledWith('assignment', true);
      expect(mockInteraction.options.getString).toHaveBeenCalledWith('date', true);
      expect(mockInteraction.options.getRole).toHaveBeenCalledWith('cohort', true);
    });

    describe.each([
      {
        label: 'all values provided',
        options: {
          course: 'INFO0001',
          assignment: 'Quiz1',
          date: '2026-01-01',
          cohort: { id: '0000000000000000001', name: 'Cohort A' }
        },
        expected: {
          course: 'INFO0001',
          assignment: 'Quiz1',
          date: '2026-01-01',
          cohort: { id: '0000000000000000001', name: 'Cohort A' }
        }
      },
      {
        label: 'all null values',
        options: {},
        expected: { course: null, assignment: null, date: null, cohort: null }
      },
      {
        label: 'mixed provided and null values',
        options: { course: 'INFO0001', assignment: 'Quiz1' },
        expected: { course: 'INFO0001', assignment: 'Quiz1', date: null, cohort: null }
      }
    ])('extracts $label', ({ options, expected }) => {
      it('returns correct output shape', () => {
        const mockInteraction = makeInteraction({
          options: makeCommandOptions(options)
        });
        const result = extractCommandInputs(mockInteraction);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('isValidChannel()', () => {
    it.each([
      { label: 'a real channel', value: { id: '1', name: 'general' } as unknown as Channel, expected: true },
      { label: 'null',           value: null,        expected: false },
      { label: 'DUPLICATE',      value: 'DUPLICATE' as const, expected: false },
    ])('returns $expected for $label', ({ value, expected }) => {
      expect(isValidChannel(value)).toBe(expected);
    });
  });

  describe('isValidChannelFilter()', () => {
    it.each([
      { label: 'a real channel', value: asChannel({ id: '0000000000000000001' }), expected: true  },
      { label: 'null',           value: null,                 expected: true  },
      { label: 'DUPLICATE',      value: 'DUPLICATE' as const, expected: false }
    ])('returns $expected for $label', ({ value, expected }) => {
      expect(isValidChannelFilter(value)).toBe(expected);
    });
  });

  describe('findDeadline()', () => {
    const mockDeadlines = [
      makeDeadline({ courseChannelId: '0', cohortId: 'A', assignment: 'Quiz 1', dueDate: '2026-01-14' }),
      makeDeadline({ courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 1', dueDate: '2026-01-15' }),
      makeDeadline({ courseChannelId: '1', cohortId: 'B', assignment: 'Quiz 1', dueDate: '2026-01-16' }),
      makeDeadline({ courseChannelId: '2', cohortId: 'A', assignment: 'Quiz 2', dueDate: '2026-01-17' })
    ];

    it('finds matching deadline', () => {
      const result = findDeadline(mockDeadlines, asChannel({ id: '0' }), asRole({ id: 'A' }), 'Quiz 1');
      expect(result).toEqual(mockDeadlines[0]);
    });

    describe.each([
      { label: 'no match found',              channel: asChannel({ id: 'nah1' }), cohort: asRole({ id: 'nah2' }), assignment: 'nah3'            },
      { label: 'assignment does not match',   channel: asChannel({ id: '1' }),    cohort: asRole({ id: 'A' }),    assignment: 'Wrong Assignment'},
      { label: 'channel is null',             channel: null,                      cohort: asRole({ id: 'A' }),    assignment: 'Quiz 1'          },
      { label: 'cohort is null',              channel: asChannel({ id: '1' }),    cohort: null,                   assignment: 'Quiz 1'          },
      { label: 'both channel and cohort are null', channel: null,                 cohort: null,                   assignment: 'Quiz 1'          }
    ])('returns undefined when $label', ({ channel, cohort, assignment }) => {
      it('returns undefined', () => {
        expect(findDeadline(mockDeadlines, channel, cohort, assignment)).toBeUndefined();
      });
    });

    it('distinguishes between different cohorts', () => {
      const result = findDeadline(mockDeadlines, asChannel({ id: '1' }), asRole({ id: 'B' }), 'Quiz 1');
      expect(result).toEqual(mockDeadlines[2]);
    });

    it('distinguishes between different assignments', () => {
      const result = findDeadline(mockDeadlines, asChannel({ id: '2' }), asRole({ id: 'A' }), 'Quiz 2');
      expect(result).toEqual(mockDeadlines[3]);
    });

    it('handles empty deadlines array', () => {
      const result = findDeadline([], asChannel({ id: '1' }), asRole({ id: 'A' }), 'Quiz 1');
      expect(result).toBeUndefined();
    });

    it('handles deadlines array with undefined entries', () => {
      const deadlinesWithGaps = [
        undefined,
        makeDeadline({ courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 1' }),
        undefined,
        makeDeadline({ courseChannelId: '2', cohortId: 'B', assignment: 'Quiz 2' })
      ];
      const result = findDeadline(deadlinesWithGaps, asChannel({ id: '1' }), asRole({ id: 'A' }), 'Quiz 1');
      expect(result).toEqual(deadlinesWithGaps[1]);
    });

    describe('edge cases', () => {
      it('handles case-sensitive assignment names', () => {
        const deadlines = [makeDeadline({ courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 1' })];
        const result = findDeadline(deadlines, asChannel({ id: '1' }), asRole({ id: 'A' }), 'quiz 1');
        expect(result).toBeUndefined();
      });

      it('distinguishes between similar assignment names', () => {
        const deadlines = [
          makeDeadline({ assignment: 'Quiz 1' }),
          makeDeadline({ assignment: 'Quiz 10' }),
          makeDeadline({ assignment: 'Quiz 1 Retake' })
        ];
        const result = findDeadline(deadlines, asChannel({ id: '1' }), asRole({ id: 'A' }), 'Quiz 1');
        expect(result).toEqual(deadlines[0]);
        expect(result!.assignment).toBe('Quiz 1');
      });

      it('handles objects without id property', () => {
        const deadlines = [makeDeadline({ courseChannelId: '1', cohortId: 'A', assignment: 'Quiz 1' })];
        const result = findDeadline(deadlines, asChannel({}), asRole({ id: 'A' }), 'Quiz 1');
        expect(result).toBeUndefined();
      });
    });
  });
});
