const { isDeadlineExpired, getActiveDeadlines, getExpiredDeadlines } = require('../../src/utils/expiration');
const { now, fromISO } = require('../../src/utils/time');

jest.mock('../../src/utils/time');

describe('expiration utils', () => {
  beforeEach(() => {
    const fixedNow = new Date('2026-01-15T23:59:00Z');
    now.mockReturnValue(fixedNow);
    fromISO.mockImplementation((isoString) => new Date(isoString));
  });

  describe('isDeadlineExpired', () => {
    it('returns false for deadlines without dueDate', () => {
      expect(isDeadlineExpired({})).toBe(false);
      expect(isDeadlineExpired(null)).toBe(false);
      expect(isDeadlineExpired(undefined)).toBe(false);
    });

    it('returns false for future deadlines', () => {
      const deadline = { dueDate: '2026-01-20T23:59:00Z' };
      expect(isDeadlineExpired(deadline)).toBe(false);
    });

    it('returns true for past deadlines', () => {
      const deadline = { dueDate: '2026-01-10T23:59:00Z' };
      expect(isDeadlineExpired(deadline)).toBe(true);
    });

    it('returns true for deadlines at current time', () => {
      const deadline = { dueDate: '2026-01-15T23:59:00Z' };
      expect(isDeadlineExpired(deadline)).toBe(true);
    });
  });

  describe('getActiveDeadlines', () => {
    it('returns empty array for empty input', () => {
      expect(getActiveDeadlines([])).toEqual([]);
    });

    it('filters out expired deadlines', () => {
      const deadlines = [
        { id: '1', dueDate: '2026-01-20T23:59:00Z' },
        { id: '2', dueDate: '2026-01-10T23:59:00Z' },
        { id: '3', dueDate: '2026-01-25T23:59:00Z' },
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
        { id: '1', dueDate: '2026-01-20T23:59:00Z' },
        { id: '2', dueDate: '2026-01-10T23:59:00Z' },
        { id: '3', dueDate: '2026-01-05T23:59:00Z' },
      ];

      const result = getExpiredDeadlines(deadlines);
      expect(result).toHaveLength(2);
      expect(result.map(d => d.id)).toEqual(['2', '3']);
    });
  });
});
