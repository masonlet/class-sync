import { Client, Events } from "discord.js";
import { loadCommands } from "../handlers/commandHandler";
import { setupInteractionHandler } from "../handlers/eventHandler";
import { startCleanupJob } from "../services/expirationCleanup";
import { startReminderJob } from "../services/reminderScheduler";

export async function setupBot(client: Client): Promise<void> {
  await loadCommands(client);
  setupInteractionHandler(client);

  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);

    const cleanupInterval = Number(process.env["CLEANUP_INTERVAL_MINUTES"]) || 30;
    startCleanupJob(readyClient, cleanupInterval);

    const reminderInterval = Number(process.env["REMINDER_INTERVAL_MINUTES"]) || 30;
    startReminderJob(readyClient, reminderInterval);

    console.log(`Startup finished`);
  });
}
