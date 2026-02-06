import { now } from "./time";
import { ValidationResult } from "../types";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function validateDeadlineTime(date: Date): ValidationResult {
  if (isNaN(date.getTime())) return { 
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
