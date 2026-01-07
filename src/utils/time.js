function now() {
  return new Date();
}

function toISO(date) {
  return date.toISOString();
}

function fromISO(iso) {
  return new Date(iso);
}

module.exports = { now, toISO, fromISO };
