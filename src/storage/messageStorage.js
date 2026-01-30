import { existsSync, readFileSync, writeFileSync } from 'fs';
import { getGuildDataPath, ensureGuildDir } from './utils.js';

export function loadMessages(guildId) {
  try {
    const messagesFile = getGuildDataPath(guildId, 'messages.json');
    if (existsSync(messagesFile)) {
      const data = readFileSync(messagesFile, 'utf8');
      const parsed = JSON.parse(data);
      return parsed && 
             typeof parsed === 'object' && 
             !Array.isArray(parsed) 
        ? parsed 
        : {};
    }
  } catch (error) {
    console.error('Error loading message tracking:', error);
  }
  return {};
}

export function saveMessages(guildId, tracking) {
  try {
    ensureGuildDir(guildId);
    const messagesFile = getGuildDataPath(guildId, 'messages.json');
    writeFileSync(messagesFile, JSON.stringify(tracking, null, 2));
  } catch (error) {
    console.error('Error saving message tracking:', error);
  }
}
