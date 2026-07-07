import { fromISO, now  } from "./time.js";
import type { Deadline } from "../types.js"

export function isDeadlineExpired(deadline: Deadline): boolean {
  if (!deadline || !deadline.dueDate) return false;
  return now() >= fromISO(deadline.dueDate);
}

export function getActiveDeadlines(deadlines: Deadline[]): Deadline[] {
  return deadlines.filter(d => !isDeadlineExpired(d));
}

export function getExpiredDeadlines(deadlines: Deadline[]): Deadline[] {
  return deadlines.filter(d => isDeadlineExpired(d));
}
