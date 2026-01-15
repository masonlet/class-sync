const { fromISO, now } = require('./time');

function isDeadlineExpired(deadline) {
  if (!deadline || !deadline.dueDate)
    return false;

  const dueDate = fromISO(deadline.dueDate);
  return now() >= dueDate;
}

function getActiveDeadlines(deadlines) {
  return deadlines.filter(d => !isDeadlineExpired(d));
}

function getExpiredDeadlines(deadlines) {
  return deadlines.filter(d => isDeadlineExpired(d));
}

module.exports = {
  isDeadlineExpired,
  getActiveDeadlines,
  getExpiredDeadlines
};