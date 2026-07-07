import { existsSync, mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "node:path";

export const DATA_DIR = join(process.cwd(), "data");

export function getGuildDataPath(
  guildId: string, 
  filename: string
): string {
  if (!guildId) throw new Error("guildId is required");
  if (!filename) throw new Error("filename is required");
  if (filename.includes("/") || 
      filename.includes("\\") || 
      filename.includes("..")
  ) throw new Error('Invalid filename');

  return join(DATA_DIR, guildId, filename);
}

export function ensureGuildDir(guildId: string): void {
  if (!guildId) throw new Error("guildId is required");

  const guildDir = join(DATA_DIR, guildId);
  if (!existsSync(guildDir)) 
    mkdirSync(guildDir, { recursive: true });
}

export function deleteGuildData(guildId: string): void {
  if (!guildId) throw new Error("guildId is required");
  rmSync(join(DATA_DIR, guildId), { recursive: true, force: true });
}

const REMOVED_MARKER = "removed.json";

export function markGuildRemoved(guildId: string): void {
  if (!guildId) throw new Error("guildId is required");
  if (!existsSync(join(DATA_DIR, guildId))) return;

  writeFileSync(
    getGuildDataPath(guildId, REMOVED_MARKER),
    JSON.stringify({ removedAt: Date.now() }, null, 2)
  );
}

export function clearGuildRemoved(guildId: string): void {
  if (!guildId) throw new Error("guildId is required");
  rmSync(join(DATA_DIR, guildId, REMOVED_MARKER), { force: true });
}

export function getRemovedGuildsOlderThan(maxAgeMs: number): string[] {
  if (!existsSync(DATA_DIR)) return [];

  const expired: string[] = [];
  for (const guildId of readdirSync(DATA_DIR)) {
    const markerPath = join(DATA_DIR, guildId, REMOVED_MARKER);
    if (!existsSync(markerPath)) continue;
    try {
      const { removedAt } = JSON.parse(readFileSync(markerPath, "utf8"));
      if (typeof removedAt === "number" && Date.now() - removedAt >= maxAgeMs)
        expired.push(guildId);
    } catch (e) {
      console.error(`Failed to read removal marker for guild ${guildId}:`, e);
    }
  }
  return expired;
}
