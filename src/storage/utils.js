import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const DATA_DIR = join(__dirname, '../../data');

export function getGuildDataPath(guildId, filename) {
  if (!guildId) throw new Error('guildId is required');
  if (!filename) throw new Error('filename is required');
  if (filename.includes('/') || 
      filename.includes('\\') || 
      filename.includes('..')
  ) throw new Error('Invalid filename');

  return join(DATA_DIR, guildId, filename);
}

export function ensureGuildDir(guildId) {
  if (!guildId) 
    throw new Error('guildId is required');

  const guildDir = join(DATA_DIR, guildId);
  if (!existsSync(guildDir))
    mkdirSync(guildDir, { recursive: true });
}
