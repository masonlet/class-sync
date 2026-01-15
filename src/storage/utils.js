const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

function getGuildDataPath(guildId, filename) {
  if (!guildId) throw new Error('guildId is required');
  if (!filename) throw new Error('filename is required');
  if (filename.includes('/') || 
      filename.includes('\\') || 
      filename.includes('..')
  ) throw new Error('Invalid filename');

  return path.join(DATA_DIR, guildId, filename);
}

function ensureGuildDir(guildId) {
  if (!guildId) 
    throw new Error('guildId is required');

  const guildDir = path.join(DATA_DIR, guildId);
  if (!fs.existsSync(guildDir))
    fs.mkdirSync(guildDir, { recursive: true });
}

module.exports = {
  getGuildDataPath,
  ensureGuildDir,
  DATA_DIR
};
