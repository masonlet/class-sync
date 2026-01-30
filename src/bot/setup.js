import { Events } from 'discord.js';
import { loadCommands } from '../handlers/commandHandler.js';
import { setupInteractionHandler } from '../handlers/eventHandler.js';
import { startCleanupJob } from '../services/expirationCleanup.js';
import { startReminderJob } from '../services/reminderScheduler.js';

export function setupBot(client) {
  loadCommands(client);
  setupInteractionHandler(client);

  client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const cleanupInterval = process.env.CLEANUP_INTERVAL_MINUTES || 30;
    startCleanupJob(client, cleanupInterval);

    const reminderInterval = process.env.REMINDER_INTERVAL_MINUTES || 30;
    startReminderJob(client, reminderInterval);

    console.log(`Startup finished`);
  });
}
