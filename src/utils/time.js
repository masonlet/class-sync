export function now() {
  return new Date();
}

export function toISO(date) {
  return date.toISOString();
}

export function fromISO(iso) {
  const date = new Date(iso);

  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    const expectedYear = parseInt(year);
    const expectedMonth = parseInt(month) - 1; // 0-indexed
    const expectedDay = parseInt(day);

    // Check if parsed date matches the input date
    if (date.getUTCFullYear() !== expectedYear ||
        date.getUTCMonth() !== expectedMonth ||
        date.getUTCDate() !== expectedDay) {
      return new Date(NaN); // Invalid date
    }
  }


  return date;
}

function toUnixSeconds(date) {
  return Math.floor(date.getTime() / 1000);
}

export function discordTimestamp(date, style = 'f') {
  if (!(date instanceof Date) || isNaN(date)) return 'Invalid date';
  return `<t:${toUnixSeconds(date)}:${style}>`;
}
