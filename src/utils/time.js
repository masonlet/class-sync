function now() {
  return new Date();
}

function toISO(date) {
  return date.toISOString();
}

function fromISO(iso) {
  return new Date(iso);
}

function toUnixSeconds(date) {
  return Math.floor(date.getTime() / 1000);
}

function discordTimestamp(date, style = 'F') {
  return `<t:${toUnixSeconds(date)}:${style}>`;
}

module.exports = { now, toISO, fromISO, discordTimestamp };
