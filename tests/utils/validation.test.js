const { validateDeadlineTime } = require('../../src/utils/validation');

jest.mock('../../src/utils/time');
const { now } = require('../../src/utils/time');

describe('validateDeadlineTime', () => {
  beforeEach(() => {
    const fixedNow = new Date('2026-01-01T23:59:00Z');
    now.mockReturnValue(fixedNow);
  });

  it('rejects null dates', () => {
    const result = validateDeadlineTime(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid date format.');
  });

  it('rejects undefined dates', () => {
    const result = validateDeadlineTime(undefined);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid date format.');
  });

  it('rejects invalid date objects', () => {
    const result = validateDeadlineTime(new Date('invalid'));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid date format.');
  });

  it('rejects deadlines in the past', () => {
    const pastDate = new Date('2025-01-01T00:00:00Z');
    const result = validateDeadlineTime(pastDate);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Deadlines must be at least 2 hours in the future.');
  });

  it('rejects deadlines less than 2 hours away', () => {
    const fixedNow = now();
    const soonDate = new Date(fixedNow.getTime() + 90 * 60 * 1000);

    const result = validateDeadlineTime(soonDate);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Deadlines must be at least 2 hours in the future.');
  });

  it('rejects deadlines exactly 2 hours away', () => {
    const fixedNow = now();
    const twoHoursDate = new Date(fixedNow.getTime() + 2 * 60 * 60 * 1000);

    const result = validateDeadlineTime(twoHoursDate);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Deadlines must be at least 2 hours in the future.');
  });

  it('accepts deadlines just over 2 hours away', () => {
    const fixedNow = now();
    const validDate = new Date(fixedNow.getTime() + 2 * 60 * 60 * 1000 + 1000);

    const result = validateDeadlineTime(validDate);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts deadlines far in the future', () => {
    const fixedNow = now();
    const futureDate = new Date(fixedNow.getTime() + 7 * 24 * 60 * 60 * 1000);

    const result = validateDeadlineTime(futureDate);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
