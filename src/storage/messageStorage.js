const fs = require('fs');
const { getGuildDataPath, ensureGuildDir } = require('./utils');

function loadMessages(guildId) {
  try {
    const messagesFile = getGuildDataPath(guildId, 'messages.json');
    if (fs.existsSync(messagesFile)) {
      const data = fs.readFileSync(messagesFile, 'utf8');
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

function saveMessages(guildId, tracking) {
  try {
    ensureGuildDir(guildId);
    const messagesFile = getGuildDataPath(guildId, 'messages.json');
    fs.writeFileSync(messagesFile, JSON.stringify(tracking, null, 2));
  } catch (error) {
    console.error('Error saving message tracking:', error);
  }
}

module.exports = { loadMessages, saveMessages };
