import { now                   } from "./time.js";
import type { ValidationResult } from "../types.js";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function validateDeadlineTime(date: Date | null | undefined): ValidationResult {
  if (!date || isNaN(date.getTime())) return {
    valid: false, 
    error: "Invalid date format."
  };

  const twoHoursFromNow = new Date(now().getTime() + TWO_HOURS_MS);
  if (date <= twoHoursFromNow) return {
    valid: false,
    error: "Deadlines must be at least 2 hours in the future."
  };

  return { valid: true };
}
