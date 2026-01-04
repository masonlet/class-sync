const fs = require('fs');
const path = require('path');

const DEADLINES_FILE = path.join(__dirname, '../../deadlines.json');

function loadDeadlines() {
  try {
    if(fs.existsSync(DEADLINES_FILE)) {
      const data = fs.readFileSync(DEADLINES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading deadlines:', error);
  }
  return []
}

function saveDeadlines(deadlines) {
  try {
    fs.writeFileSync(DEADLINES_FILE, JSON.stringify(deadlines, null, 2));
  } catch(error) {
    console.error('Error saving deadlines:', error);
  }
}

module.exports = { loadDeadlines, saveDeadlines };
