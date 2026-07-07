import { Client } from "discord.js";
import { getActiveDeadlines                         } from "../utils/expiration.js";
import { loadDeadlines, saveDeadlines               } from "../storage/deadlineStorage.js";
import { getRemovedGuildsOlderThan, deleteGuildData } from "../storage/storageHelpers.js";

const REMOVAL_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

let cleanupInterval: NodeJS.Timeout | null = null;

export async function cleanupExpiredDeadlines(
  guildId: string
): Promise<{ removed: number; deadlineIds: string[] }> {
  const allDeadlines = loadDeadlines(guildId);
  const activeDeadlines = getActiveDeadlines(allDeadlines);
  const activeIds = new Set(activeDeadlines.map(d => d.id));

  const removedIds = allDeadlines
    .filter(d => !activeIds.has(d.id))
    .map(d => d.id);

  if (removedIds.length > 0) saveDeadlines(guildId, activeDeadlines);

  return { removed: removedIds.length, deadlineIds: removedIds };
}

export function purgeRemovedGuilds(): number {
  const expired = getRemovedGuildsOlderThan(REMOVAL_GRACE_MS);
  for (const guildId of expired) {
    deleteGuildData(guildId);
    console.log(`Purged data for removed guild ${guildId}`);
  }
  return expired.length;
}

function startInterval(client: Client, intervalMinutes: number) {
  const intervalMs = intervalMinutes * 60 * 1000;
  console.log(`Starting expiration cleanup job (every ${intervalMinutes} minutes)`);

  cleanupInterval = setInterval(async () => {
    try {
      for (const guild of client.guilds.cache.values()) {
        const result = await cleanupExpiredDeadlines(guild.id);
        if (result.removed > 0) console.log(
          `Cleaned up ${result.removed} expired deadline(s) in guild ${guild.id}`
        );
      }
      purgeRemovedGuilds();
    } catch (error) {
      console.error('Error during expiration cleanup:', error);
    }
  }, intervalMs);
}

export function startCleanupJob(client: Client | null | undefined, intervalMinutes: number = 15): void {
  if (cleanupInterval) {
    console.log('Cleanup job already running');
    return;
  }
  if (!client) throw new Error('startCleanupJob was called without a client');

  startInterval(client, intervalMinutes);
}

export function stopCleanupJob(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('Stopped expiration cleanup job');
  }
}
