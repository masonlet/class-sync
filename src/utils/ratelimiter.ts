const DEFAULT_MAX_USES = 5;
const DEFAULT_WINDOW_MS = 10000;
const CLEANUP_INTERVAL_MS = 60000;

const cooldowns = new Map();

const intervalId = setInterval((): void => {
  const now = Date.now();

  for (const [key, entry] of cooldowns.entries()) {
    if (now >= entry.resetTime) {
      cooldowns.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

intervalId.unref(); // Allows process to exit while timer's still active

export function isLimited(
  userId: string,
  commandName: string,
  maxUses = DEFAULT_MAX_USES,
  windowMs = DEFAULT_WINDOW_MS
): boolean {
  const key = `${userId}-${commandName}`;
  const now = Date.now();
  let entry = cooldowns.get(key);

  if(!entry || now >= entry.resetTime) {
    cooldowns.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (entry.count >= maxUses)
    return true;

  entry.count += 1;

  return false;
}

export function getRemainingTime(
  userId: string, 
  commandName: string
): number {
  const key = `${userId}-${commandName}`;
  const entry = cooldowns.get(key);

  if (!entry || Date.now() >= entry.resetTime)
    return 0;

  return Math.ceil((entry.resetTime - Date.now()) / 1000);
}

export function resetCooldowns(): void {
  cooldowns.clear();
}

export function cleanup(): void {
  clearInterval(intervalId);
}
