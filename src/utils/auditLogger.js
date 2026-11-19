const fs = require('fs/promises');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

async function logEvent(event, data) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), event, data }) + '\n';
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.appendFile(LOG_FILE, line);
  } catch (err) {
    console.error('Could not write audit log:', err.message);
  }
}

module.exports = { logEvent };
