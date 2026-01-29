const { isLimited, getRemainingTime, resetCooldowns, cleanup } = require('../../src/utils/ratelimiter');

describe('rateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    resetCooldowns();
  });

  afterEach(() => {
    jest.useRealTimers();
    cleanup();
  });

  describe('isLimited', () => {
    it('allows first use in window', () => {
      expect(isLimited('user1', 'add-deadline')).toBe(false);
    });

    describe.each([
      { uses: 4, shouldLimit: false },
      { uses: 5, shouldLimit: false },
      { uses: 6, shouldLimit: true }
    ])('after $uses uses in 10s window', ({ uses, shouldLimit }) => {
      beforeEach(() => {
        for (let i = 0; i < uses - 1; i++)
          isLimited('user1', 'add-deadline');
      });

      it(`returns ${shouldLimit}`, () => {
        expect(isLimited('user1', 'add-deadline')).toBe(shouldLimit);
      });
    });

    it('resets count after window expires', () => {
      isLimited('user1', 'add-deadline');
      jest.advanceTimersByTime(10000);
      expect(isLimited('user1', 'add-deadline')).toBe(false);
    });

    it('scopes to user and command', () => {
      isLimited('user1', 'add-deadline');
      expect(isLimited('user2', 'add-deadline')).toBe(false);
      expect(isLimited('user1', 'remove-deadline')).toBe(false);
    });

    it('uses custom limits', () => {
      expect(isLimited('user1', 'add-deadline', 1, 5000)).toBe(false);
      expect(isLimited('user1', 'add-deadline', 1, 5000)).toBe(true);
    });
  });

  describe('getRemainingTime', () => {
    it('returns 0 when no cooldown or expired', () => {
      expect(getRemainingTime('user1', 'add-deadline')).toBe(0);
      isLimited('user1', 'add-deadline');
      jest.advanceTimersByTime(10001);
      expect(getRemainingTime('user1', 'add-deadline')).toBe(0);
    });

    it('returns seconds until reset', () => {
      isLimited('user1', 'add-deadline');
      jest.advanceTimersByTime(3000);
      expect(getRemainingTime('user1', 'add-deadline')).toBe(7);
    });
  });

  describe('cleanup interval', () => {
    it('removes expired entries after interval', () => {
      for (let i = 0; i < 6; i++) isLimited('user1', 'add-deadline');
      expect(isLimited('user1', 'add-deadline')).toBe(true);
      jest.advanceTimersByTime(10001 + 60000);
      expect(isLimited('user1', 'add-deadline')).toBe(false);
    });
  });
});
