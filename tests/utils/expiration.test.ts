import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Deadline } from '../../src/types';
import { now, fromISO } from '../../src/utils/time';
import { makeDeadline } from '../helpers/interactions';
import { isDeadlineExpired, getActiveDeadlines, getExpiredDeadlines } from '../../src/utils/expiration';

vi.mock('../../src/utils/time');

describe('expiration utils', () => {
  beforeEach(() => {
    vi.mocked(now).mockReturnValue(new Date('2026-01-15T23:59:00Z'));
    vi.mocked(fromISO).mockImplementation((isoString: string) => new Date(isoString));
  });

  describe('isDeadlineExpired', () => {
    it('returns false for deadlines without dueDate', () => {
      expect(isDeadlineExpired({} as Deadline)).toBe(false);
      expect(isDeadlineExpired(null as unknown as Deadline)).toBe(false);
      expect(isDeadlineExpired(undefined as unknown as Deadline)).toBe(false);
    });

    it('returns false for future deadlines', () => {
      const deadline = makeDeadline({ dueDate: '2026-01-20T23:59:00Z' });
      expect(isDeadlineExpired(deadline)).toBe(false);
    });

    it('returns true for past deadlines', () => {
      const deadline = makeDeadline({ dueDate: '2026-01-10T23:59:00Z' });
      expect(isDeadlineExpired(deadline)).toBe(true);
    });

    it('returns true for deadlines at current time', () => {
      const deadline = makeDeadline({ dueDate:'2026-01-15T23:59:00Z' });
      expect(isDeadlineExpired(deadline)).toBe(true);
    });
  });

  describe('getActiveDeadlines', () => {
    it('returns empty array for empty input', () => {
      expect(getActiveDeadlines([])).toEqual([]);
    });

    it('filters out expired deadlines', () => {
      const deadlines = [
        makeDeadline({ id: '1', dueDate: '2026-01-20T23:59:00Z' }),
        makeDeadline({ id: '2', dueDate: '2026-01-10T23:59:00Z' }),
        makeDeadline({ id: '3', dueDate: '2026-01-25T23:59:00Z' }),
      ];

      const result = getActiveDeadlines(deadlines);
      expect(result).toHaveLength(2);
      expect(result.map(d => d.id)).toEqual(['1', '3']);
    });
  });

  describe('getExpiredDeadlines', () => {
    it('returns empty array for empty input', () => {
      expect(getExpiredDeadlines([])).toEqual([]);
    });

    it('returns only expired deadlines', () => {
      const deadlines = [
        makeDeadline({ id: '1', dueDate: '2026-01-20T23:59:00Z' }),
        makeDeadline({ id: '2', dueDate: '2026-01-10T23:59:00Z' }),
        makeDeadline({ id: '3', dueDate: '2026-01-05T23:59:00Z' }),
      ];

      const result = getExpiredDeadlines(deadlines);
      expect(result).toHaveLength(2);
      expect(result.map(d => d.id)).toEqual(['2', '3']);
    });
  });
});
