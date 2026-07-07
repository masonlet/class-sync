import { existsSync, mkdirSync, rmSync } from "fs";
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
