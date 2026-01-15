const { getExpiredDeadlines } = require('../utils/expiration');
const { getAllDeadlines, removeDeadline } = require('../storage/deadlineStorage');

let cleanupInterval = null;

async function cleanupExpiredDeadlines() {
  const allDeadlines = getAllDeadlines();
  const expiredDeadlines = getExpiredDeadlines(allDeadlines);

  const removedIds = [];

  for (const deadline of expiredDeadlines) {
    removeDeadline(deadline.id);
    removedIds.push(deadline.id);
  }

  return {
    removed: removedIds.length,
    deadlineIds: removedIds
  };
}

function startCleanupJob(intervalMinutes = 15) {
  if (cleanupInterval) {
    console.log('Cleanup job already running');
    return;
  }

  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`Starting expiration cleanup job (every ${intervalMinutes} minutes)`);

  cleanupInterval = setInterval(async () => {
    try {
      const result = await cleanupExpiredDeadlines();
      if (result.removed > 0)
        console.log(`Cleaned up ${result.removed} expired deadline(s)`);
    } catch (error) {
      console.error('Error during expiration cleanup:', error);
    }
  }, intervalMs);
}

function stopCleanupJob() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('Stopped expiration cleanup job');
  }
}

module.exports = {
  cleanupExpiredDeadlines,
  startCleanupJob,
  stopCleanupJob
};
