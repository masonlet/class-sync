const {
  getHoursUntilDeadline,
  shouldSendReminder,
  formatNormalReminder,
  formatLateReminder,
  REMINDER_WINDOWS
} = require('../../services/reminderScheduler');

jest.mock('../../utils/time');
const { now, fromISO, discordTimestamp } = require('../../utils/time');

describe('reminderScheduler', () => {
  beforeEach(() => {
    const fixedNow = new Date('2026-01-20T12:00:00Z');
    now.mockReturnValue(fixedNow);
    fromISO.mockImplementation((isoString) => new Date(isoString));
    discordTimestamp.mockImplementation((date, format) => {
      if (format == 'R') return '<t:1737374400:R>';
      return '<t:1737374400:F>';
    });
  });

  describe('getHoursUntilDeadline', () => {
    it('calculates hours correctly for future deadline', () => {
      const dueDate = '2026-01-21T12:00:00Z';
      const hours = getHoursUntilDeadline(dueDate);
      expect(hours).toBe(24);
    });

    it('calculates hours correctly for past deadline', () => {
      const dueDate = '2026-01-19T12:00:00Z';
      const hours = getHoursUntilDeadline(dueDate);
      expect(hours).toBe(-24);
    });

    it('handles fractional hours', () => {
      const dueDate = '2026-01-20T12:30:00Z';
      const hours = getHoursUntilDeadline(dueDate);
      expect(hours).toBe(0.5);
    });
  });

  describe('shouldSendReminder - 24h reminder', () => {
    it('sends normal reminder in 23-24 hour window', () => {
      expect(shouldSendReminder(23.5, '24h', false)).toEqual({ shouldSend: true, isLate: false });
      expect(shouldSendReminder(24, '24h', false)).toEqual({ shouldSend: true, isLate: false });
      expect(shouldSendReminder(23, '24h', false)).toEqual({ shouldSend: true, isLate: false });
    });

    it('sends late reminder in 17-23 hour window', () => {
      expect(shouldSendReminder(22, '24h', false)).toEqual({ shouldSend: true, isLate: true });
      expect(shouldSendReminder(20, '24h', false)).toEqual({ shouldSend: true, isLate: true });
      expect(shouldSendReminder(17, '24h', false)).toEqual({ shouldSend: true, isLate: true });
    });

    it('does not send if already sent', () => {
      expect(shouldSendReminder(23.5, '24h', true)).toEqual({ shouldSend: false, isLate: false });
      expect(shouldSendReminder(20, '24h', true)).toEqual({ shouldSend: false, isLate: false });
    });

    it('does not send if expired (< 16 hours)', () => {
      expect(shouldSendReminder(15, '24h', false)).toEqual({ shouldSend: false, isLate: false });
      expect(shouldSendReminder(10, '24h', false)).toEqual({ shouldSend: false, isLate: false });
      expect(shouldSendReminder(5, '24h', false)).toEqual({ shouldSend: false, isLate: false });
    });

    it('does not send if deadline has passed', () => {
      expect(shouldSendReminder(-1, '24h', false)).toEqual({ shouldSend: false, isLate: false });
    });
  });

  describe('shouldSendReminder - 8h reminder', () => {
    it('sends normal reminder in 7-9 hour window', () => {
      expect(shouldSendReminder(7, '8h', false)).toEqual({ shouldSend: true, isLate: false });
      expect(shouldSendReminder(8, '8h', false)).toEqual({ shouldSend: true, isLate: false });
      expect(shouldSendReminder(9, '8h', false)).toEqual({ shouldSend: true, isLate: false });
    });

    it('sends late reminder in 5-7 hour window', () => {
      expect(shouldSendReminder(5, '8h', false)).toEqual({ shouldSend: true, isLate: true });
      expect(shouldSendReminder(6, '8h', false)).toEqual({ shouldSend: true, isLate: true });
      expect(shouldSendReminder(6.5, '8h', false)).toEqual({ shouldSend: true, isLate: true });
    });

    it('does not send if already sent', () => {
      expect(shouldSendReminder(8, '8h', true)).toEqual({ shouldSend: false, isLate: false });
      expect(shouldSendReminder(6, '8h', true)).toEqual({ shouldSend: false, isLate: false });
    });

    it('does not send if expired (< 4 hours)', () => {
      expect(shouldSendReminder(3, '8h', false)).toEqual({ shouldSend: false, isLate: false });
      expect(shouldSendReminder(2, '8h', false)).toEqual({ shouldSend: false, isLate: false });
    });
  });

  describe('shouldSendReminder - 1h reminder', () => {
    it('sends normal reminder in 0.5-1 hour window', () => {
      expect(shouldSendReminder(0.5, '1h', false)).toEqual({ shouldSend: true, isLate: false });
      expect(shouldSendReminder(0.75, '1h', false)).toEqual({ shouldSend: true, isLate: false });
      expect(shouldSendReminder(1, '1h', false)).toEqual({ shouldSend: true, isLate: false });
    });

    it('sends late reminder in 0-0.5 hour window', () => {
      expect(shouldSendReminder(0.1, '1h', false)).toEqual({ shouldSend: true, isLate: true });
      expect(shouldSendReminder(0.25, '1h', false)).toEqual({ shouldSend: true, isLate: true });
      expect(shouldSendReminder(0.49, '1h', false)).toEqual({ shouldSend: true, isLate: true });
    });

    it('does not send if already sent', () => {
      expect(shouldSendReminder(0.75, '1h', true)).toEqual({ shouldSend: false, isLate: false });
      expect(shouldSendReminder(0.25, '1h', true)).toEqual({ shouldSend: false, isLate: false });
    });

    it('does not send if deadline has passed', () => {
      expect(shouldSendReminder(-0.1, '1h', false)).toEqual({ shouldSend: false, isLate: false });
      expect(shouldSendReminder(-1, '1h', false)).toEqual({ shouldSend: false, isLate: false });
    });

    it('never expires - sends late reminder right up to deadline', () => {
      expect(shouldSendReminder(0.01, '1h', false)).toEqual({ shouldSend: true, isLate: true });
    });
  });

describe('formatNormalReminder', () => {
    it('formats normal reminder correctly', () => {
      const deadline = {
        assignment: 'Homework 1',
        courseChannelName: 'programming-fundamentals',
        cohortId: '123456',
        dueDate: '2026-01-20T23:59:00Z'
      };

      const message = formatNormalReminder(deadline, '24h');

      expect(message).toContain('<@&123456>');
      expect(message).toContain('Deadline Reminder');
      expect(message).toContain('**Assignment:** Homework 1');
      expect(message).toContain('**Course:** programming-fundamentals');
    });
  });

  describe('formatLateReminder', () => {
    it('formats 24h late reminder correctly', () => {
      const deadline = {
        assignment: 'Homework 1',
        courseChannelName: 'programming-fundamentals',
        cohortId: '123456',
        dueDate: '2026-01-20T23:59:00Z'
      };

      const message = formatLateReminder(deadline, '24h');

      expect(message).toContain('<@&123456>');
      expect(message).toContain('Late 24-Hour Reminder (Bot Downtime)');
      expect(message).toContain('**Assignment:** Homework 1');
      expect(message).toContain('**Course:** programming-fundamentals');
      expect(message).toContain('Sorry for the delay');
    });

    it('formats 8h late reminder correctly', () => {
      const deadline = {
        assignment: 'Test 2',
        courseChannelName: 'data-structures',
        cohortId: '789',
        dueDate: '2026-01-21T12:00:00Z'
      };

      const message = formatLateReminder(deadline, '8h');

      expect(message).toContain('Late 8-Hour Reminder');
    });

    it('formats 1h late reminder correctly', () => {
      const deadline = {
        assignment: 'Quiz 3',
        courseChannelName: 'algorithms',
        cohortId: '999',
        dueDate: '2026-01-20T13:00:00Z'
      };

      const message = formatLateReminder(deadline, '1h');

      expect(message).toContain('Late 1-Hour Reminder');
    });
  });
});