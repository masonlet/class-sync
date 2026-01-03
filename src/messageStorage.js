const fs = require('fs');

const MESSAGES_FILE = './messages.json';

function loadMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
      return JSON.parse(data);
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

module.exports = { loadMessages, saveMessages };
