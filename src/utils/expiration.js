import { fromISO, now } from './time.js';

export function isDeadlineExpired(deadline) {
  if (!deadline || !deadline.dueDate)
    return false;

  const dueDate = fromISO(deadline.dueDate);
  return now() >= dueDate;
}

export function getActiveDeadlines(deadlines) {
  return deadlines.filter(d => !isDeadlineExpired(d));
}

export function getExpiredDeadlines(deadlines) {
  return deadlines.filter(d => isDeadlineExpired(d));
}
