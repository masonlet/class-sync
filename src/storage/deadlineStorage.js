const fs = require('fs');
const { getGuildDataPath, ensureGuildDir } = require('./utils');

function loadDeadlines(guildId) {
  try {
    const deadlinesFile = getGuildDataPath(guildId, 'deadlines.json');
    if(fs.existsSync(deadlinesFile)) {
      const data = fs.readFileSync(deadlinesFile, 'utf8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('Error loading deadlines:', error);
  }
  return [];
}

function saveDeadlines(guildId, deadlines) {
  try {
    ensureGuildDir(guildId);
    const deadlinesFile = getGuildDataPath(guildId, 'deadlines.json');
    fs.writeFileSync(deadlinesFile, JSON.stringify(deadlines, null, 2));
  } catch(error) {
    console.error('Error saving deadlines:', error);
  }
}

module.exports = { loadDeadlines, saveDeadlines };
