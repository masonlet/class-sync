import { fromISO, now } from "./time";
import type { Deadline } from "../types"

export function isDeadlineExpired(deadline: Deadline): boolean {
  if (!deadline || !deadline.dueDate)
    return false;

  const dueDate = fromISO(deadline.dueDate);
  return now() >= dueDate;
}

export function getActiveDeadlines(deadlines: Deadline[]): Deadline[] {
  return deadlines.filter(d => !isDeadlineExpired(d));
}

export function getExpiredDeadlines(deadlines: Deadline[]): Deadline[] {
  return deadlines.filter(d => isDeadlineExpired(d));
}
