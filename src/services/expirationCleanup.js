import { getActiveDeadlines } from '../utils/expiration.js';
import { loadDeadlines, saveDeadlines } from '../storage/deadlineStorage.js';

let cleanupInterval = null;

export async function cleanupExpiredDeadlines(guildId) {
  const allDeadlines = loadDeadlines(guildId);
  const activeDeadlines = getActiveDeadlines(allDeadlines);

  const removedCount = allDeadlines.length - activeDeadlines.length;
  const removedIds = allDeadlines
    .filter(d => !activeDeadlines.includes(d))
    .map(d => d.id);

  if (removedCount > 0)
    saveDeadlines(guildId, activeDeadlines);

  return { removed: removedCount, deadlineIds: removedIds };
}

function startInterval(client, intervalMinutes) {
  const intervalMs = intervalMinutes * 60 * 1000;
  console.log(`Starting expiration cleanup job (every ${intervalMinutes} minutes)`);

  cleanupInterval = setInterval(async () => {
    try {
      for (const guild of client.guilds.cache.values()) {
        const result = await cleanupExpiredDeadlines(guild.id);
        if (result.removed > 0)
          console.log(`Cleaned up ${result.removed} expired deadline(s) in guild ${guild.id}`);
      }
    } catch (error) {
      console.error('Error during expiration cleanup:', error);
    }
  }, intervalMs);
}

export function startCleanupJob(client, intervalMinutes = 15) {
  if (cleanupInterval) return console.log('Cleanup job already running');
  if (!client) throw new Error('startCleanupJob was called without a client');

  startInterval(client, intervalMinutes);
}

export function stopCleanupJob() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('Stopped expiration cleanup job');
  }
}
