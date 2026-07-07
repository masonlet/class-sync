import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateDeadlineTime } from '../../src/utils/validation.js';
import { now                  } from '../../src/utils/time.js';

vi.mock('../../src/utils/time');

describe('validateDeadlineTime', () => {
  beforeEach(() => {
    const fixedNow = new Date('2026-01-01T23:59:00Z');
    vi.mocked(now).mockReturnValue(fixedNow);
  });

  describe('format validation', () => {
    it.each([
      { label: 'null dates',           value: null                },
      { label: 'undefined dates',      value: undefined           },
      { label: 'invalid date objects', value: new Date('invalid') },
    ])('rejects $label', ({ value }) => {
      expect(validateDeadlineTime(value)).toEqual({
        valid: false,
        error: 'Invalid date format.'
      });
    });
  });

  describe('minimum time validation', () => {
    it.each([
      { label: 'in the past',            getTestDate: () => new Date('2025-01-01T00:00:00Z')               },
      { label: 'less than 2 hours away', getTestDate: () => new Date(now().getTime() + 90 * 60 * 1000)     },
      { label: 'exactly 2 hours away',   getTestDate: () => new Date(now().getTime() + 2 * 60 * 60 * 1000) },
    ])('rejects deadlines $label', ({ getTestDate }) => {
      expect(validateDeadlineTime(getTestDate())).toEqual({
        valid: false,
        error: 'Deadlines must be at least 2 hours in the future.'
      });
    });
  });

  describe('valid deadlines', () => {
    it.each([
      { label: 'just over 2 hours away', getTestDate: () => new Date(now().getTime() + 2 * 60 * 60 * 1000 + 1000) },
      { label: 'far in the future',      getTestDate: () => new Date(now().getTime() + 7 * 24 * 60 * 60 * 1000)   },
    ])('accepts deadlines $label', ({ getTestDate }) => {
      expect(validateDeadlineTime(getTestDate())).toEqual({
        valid: true
      });
    });
  });
});
