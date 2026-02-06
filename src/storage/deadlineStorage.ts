import { existsSync, readFileSync, writeFileSync } from "fs";
import { getGuildDataPath, ensureGuildDir } from "./storageHelpers";
import { Deadline } from "../types";

export function loadDeadlines(guildId: string): Deadline[] {
  try {
    const deadlinesFile = getGuildDataPath(guildId, "deadlines.json");
    if(existsSync(deadlinesFile)) {
      const data = readFileSync(deadlinesFile, "utf8");
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error("Error loading deadlines:", error);
  }
  return [];
}

export function saveDeadlines(
  guildId: string, 
  deadlines: Deadline[]
): void {
  try {
    ensureGuildDir(guildId);
    const deadlinesFile = getGuildDataPath(guildId, "deadlines.json");
    writeFileSync(deadlinesFile, JSON.stringify(deadlines, null, 2));
  } catch(error) {
    console.error("Error saving deadlines:", error);
  }
}
