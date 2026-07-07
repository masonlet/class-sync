import { describe, it, expect } from 'vitest';
import { now, toISO, fromISO, discordTimestamp } from '../../src/utils/time.js';

describe('time utilities', () => {
  describe('now()', () => {
    it('returns a Date object', () => {
      const result = now();
      expect(result).toBeInstanceOf(Date);
    });

    it('returns current time', () => {
      const before = Date.now();
      const result = now();
      const after = Date.now();

      expect(result.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('toISO()', () => {
    it('converts Date to ISO string', () => {
      const date = new Date('2026-01-01T11:59:59.000Z');
      const result = toISO(date);

      expect(result).toBe('2026-01-01T11:59:59.000Z');
    });
  });

  describe('fromISO()', () => {
    it('converts ISO string to Date', () => {
      const iso = '2026-01-15T10:30:00.000Z';
      const result = fromISO(iso);

      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(iso);
    });

    it('parses date components correctly', () => {
      const iso = '2026-12-25T23:59:59.999Z';
      const result = fromISO(iso);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(11); 
      expect(result.getDate()).toBe(25);
    });

    it('handles timezone offsets', () => {
      const iso = '2026-01-15T05:30:00-05:00';
      const result = fromISO(iso);
      
      expect(result.toISOString()).toBe('2026-01-15T10:30:00.000Z');
    });

    it('returns Invalid Date for malformed strings', () => {
      const result = fromISO('not-a-date');
      expect(result.getTime()).toBeNaN();
    });

    it('returns Invalid Date for impossible dates', () => {
      const result = fromISO('2026-13-40T99:99:99.000Z');
      expect(result.getTime()).toBeNaN();
    });

    describe('edge cases', () => {
      it('handles leap year dates correctly', () => {
        const leapYear = '2024-02-29T12:00:00.000Z';
        const result = fromISO(leapYear);

        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(1);
        expect(result.getDate()).toBe(29);
      });

      it('rejects invalid leap year dates', () => {
        const invalidLeapYear = '2025-02-29T12:00:00.000Z';
        const result = fromISO(invalidLeapYear);

        expect(result.getTime()).toBeNaN();
      });

      it('handles year boundary transitions', () => {
        const newYearEve = '2025-12-31T23:59:59.999Z';
        const newYear = '2026-01-01T00:00:00.000Z';

        const result1 = fromISO(newYearEve);
        const result2 = fromISO(newYear);

        expect(result1.getUTCFullYear()).toBe(2025);
        expect(result2.getUTCFullYear()).toBe(2026);
        expect(result2.getTime() - result1.getTime()).toBe(1);
      });

      it('handles various timezone formats', () => {
        const utc = fromISO('2026-01-15T10:00:00Z');
        const withPlus = fromISO('2026-01-15T10:00:00+00:00');
        const withOffset = fromISO('2026-01-15T05:00:00-05:00');

        expect(utc.toISOString()).toBe('2026-01-15T10:00:00.000Z');
        expect(withPlus.toISOString()).toBe('2026-01-15T10:00:00.000Z');
        expect(withOffset.toISOString()).toBe('2026-01-15T10:00:00.000Z');
      });

      it('handles milliseconds precision', () => {
        const withMs = fromISO('2026-01-15T10:30:45.123Z');
        const withoutMs = fromISO('2026-01-15T10:30:45Z');

        expect(withMs.getMilliseconds()).toBe(123);
        expect(withoutMs.getMilliseconds()).toBe(0);
      });
    });
  });

  describe('discordTimestamp()', () => {
    it('returns Discord timestamp with default format', () => {
      const date = new Date('2026-01-15T10:30:00.000Z');
      const result = discordTimestamp(date);

      expect(result).toMatch(/^<t:\d+:f>$/);
    });

    it('accepts custom format styles', () => {
      const date = new Date('2026-01-15T10:30:00.000Z');

      expect(discordTimestamp(date, 'R')).toContain(':R>');
      expect(discordTimestamp(date, 't')).toContain(':t>');
      expect(discordTimestamp(date, 'D')).toContain(':D>');
    });

    it('converts to Unix timestamp seconds', () => {
      const date = new Date('2026-01-15T10:30:00.000Z');
      const expectedUnix = Math.floor(date.getTime() / 1000);
      const result = discordTimestamp(date);

      expect(result).toBe(`<t:${expectedUnix}:f>`);
    });

    it('floors milliseconds to whole seconds', () => {
      const date = new Date('1970-01-01T00:00:01.999Z');
      const result = discordTimestamp(date);

      expect(result).toBe('<t:1:f>');
    });

    describe('edge cases', () => {
      it('handles unix epoch correctly', () => {
        const epoch = new Date(0);
        const result = discordTimestamp(epoch);

        expect(result).toBe('<t:0:f>');
      });

      it('handles far future dates', () => {
        const farFuture = new Date('2099-12-31T23:59:59.999Z');
        const result = discordTimestamp(farFuture);

        expect(result).toMatch(/^<t:\d+:f>$/);
      });

      it('handles negative timestamps for pre-1970 dates', () => {
        const preEpoch = new Date('1969-12-31T23:59:59.000Z');
        const result = discordTimestamp(preEpoch);

        expect(result).toMatch(/^<t:-?\d+:f>$/);
      });
    });
  });

  describe('round-trip conversion', () => {
    it('toISO and fromISO are inverses', () => {
      const original = new Date('2026-03-10T14:20:30.500Z');
      const iso = toISO(original);
      const result = fromISO(iso);

      expect(result.getTime()).toBe(original.getTime());
    });
  });
});
