export function now(): Date {
  return new Date();
}

export function toISO(date: Date): string {
  return date.toISOString();
}

export function fromISO(iso: string): Date {
  const date = new Date(iso);

  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const expectedYear = parseInt(match[1]!);
    const expectedMonth = parseInt(match[2]!) - 1; // 0-indexed
    const expectedDay = parseInt(match[3]!);

    // Check if parsed date matches the input date
    if (date.getUTCFullYear() !== expectedYear ||
        date.getUTCMonth() !== expectedMonth ||
        date.getUTCDate() !== expectedDay) {
      return new Date(NaN); // Invalid date
    }
  }

  return date;
}

function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function discordTimestamp(date: Date, style: string = 'f'): string {
  if (isNaN(date.getTime())) return "Invalid date";
  return `<t:${toUnixSeconds(date)}:${style}>`;
}
