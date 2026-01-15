const fs = require('fs');
const path = require('path');

const MESSAGES_FILE = path.join(__dirname, '../../messages.json');

function loadMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
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

function saveMessages(tracking) {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(tracking, null, 2));
  } catch (error) {
    console.error('Error saving message tracking:', error);
  }
}

module.exports = { loadMessages, saveMessages, MESSAGES_FILE };
