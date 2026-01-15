const { now } = require('./time');

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function validateDeadlineTime(date) {
  if (!date || !(date instanceof Date) || isNaN(date))
    return { valid: false, error: 'Invalid date format.' };

  const twoHoursFromNow = new Date(now().getTime() + TWO_HOURS_MS);

  if (date <= twoHoursFromNow) 
    return { valid: false, error: 'Deadlines must be at least 2 hours in the future.' };

  return { valid: true };
}

module.exports = { validateDeadlineTime };
