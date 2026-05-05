import { Client, Guild } from "discord.js";
import type { Deadline, ReminderType } from "../types";
import { loadDeadlines, saveDeadlines } from '../storage/deadlineStorage.js';
import { fromISO, now, discordTimestamp } from '../utils/time.js';

type ReminderWindow = {
  normal: { min: number; max: number };
  late: { min: number; max: number };
  expiry: number | null;
}

export const REMINDER_WINDOWS: Record<ReminderType, ReminderWindow> = {
  '24h': {
    normal: { min: 23, max: 24 },
    late: { min: 17, max: 23 },
    expiry: 16
  },
  '8h': {
    normal: { min: 7, max: 9 },
    late: { min: 5, max: 7 },
    expiry: 4
  },
  '1h': {
    normal: { min: 0.5, max: 1 },
    late: { min: 0, max: 0.5 },
    expiry: null
  }
};

let reminderInterval: NodeJS.Timeout | null = null;

export function getHoursUntilDeadline(date: string): number {
  const due = fromISO(date);
  const currentTime = now();
  const msUntilDue = due.getTime() - currentTime.getTime();
  return msUntilDue / (1000 * 60 * 60);
}

function isInWindow(hours: number, window: { min: number; max: number }) {
  return hours >= window.min && hours <= window.max;
}

export function shouldSendReminder(
  hoursUntilDue: number,
  reminderType: ReminderType,
  alreadySent: boolean
): { shouldSend: boolean; isLate: boolean } {
  if (alreadySent) return { shouldSend: false, isLate: false };

  const windows = REMINDER_WINDOWS[reminderType];

  if (hoursUntilDue < 0)  return { shouldSend: false, isLate: false };

  if (isInWindow(hoursUntilDue, windows.normal)) return {
    shouldSend: true, isLate: false
  };

  if (isInWindow(hoursUntilDue, windows.late)) return {
    shouldSend: true, isLate: true
  };

  if (windows.expiry !== null && hoursUntilDue < windows.expiry) return {
    shouldSend: false, isLate: false
  };

  return { shouldSend: false, isLate: false };
}

export  function formatNormalReminder(deadline: Deadline): string {
  return `<@&${deadline.cohortId}> Deadline Reminder\n\n`
       + `**Assignment:** ${deadline.assignment}\n`
       + `**Course:** ${deadline.courseChannelName}\n`
       + `**Due:** ${discordTimestamp(fromISO(deadline.dueDate))} (${discordTimestamp(fromISO(deadline.dueDate), 'R')})\n\n`;
}

export function formatLateReminder(
  deadline: Deadline,
  reminderType: ReminderType
): string {
  const timeLabel = {
    '24h': '24-Hour',
    '8h': '8-Hour',
    '1h': '1-Hour'
  }[reminderType];

  return `<@&${deadline.cohortId}> Late ${timeLabel} Reminder (Bot Downtime)\n\n`
       + `**Assignment:** ${deadline.assignment}\n`
       +  `**Course:** ${deadline.courseChannelName}\n`
       + `**Due:** ${discordTimestamp(fromISO(deadline.dueDate))} (${discordTimestamp(fromISO(deadline.dueDate), 'R')})\n\n`
       + `Sorry for the delay - this reminder should have been sent earlier.`;
}

async function sendReminder(
  guild: Guild,
  deadline: Deadline,
  reminderType: ReminderType,
  isLate: boolean
): Promise<boolean> {
  try {
    const channel = await guild.channels.fetch(deadline.reminderLocationId);
    if (!channel || ! ("send" in channel)) {
      console.error(`Reminder location not found: ${deadline.reminderLocationId}`);
      return false;
    }

    const message = isLate
      ? formatLateReminder(deadline, reminderType)
      : formatNormalReminder(deadline);

    await channel.send(message);
    console.log(`Sent ${isLate ? 'late' : 'normal'} ${reminderType} reminder for: ${deadline.assignment}`);
    return true;
  } catch (e) {
    console.error(`Failed to send reminder for ${deadline.assignment}:`, e);
    return false;
  }
}

async function processDeadlineReminders(
  guild: Guild,
  deadline: Deadline
) {
  const hoursUntilDue = getHoursUntilDeadline(deadline.dueDate);
  let anySent = false;

  for (const reminderType of ["24h", "8h", "1h"] as const) {
    const alreadySent = deadline.remindersSent?.[reminderType] || false;
    const { shouldSend, isLate } = shouldSendReminder(hoursUntilDue, reminderType, alreadySent);

    if (shouldSend) {
      const success = await sendReminder(guild, deadline, reminderType, isLate);

      if(success) {
        if (!deadline.remindersSent)
          deadline.remindersSent = { '24h': false, '8h': false, '1h': false };

        deadline.remindersSent[reminderType] = true;
        anySent = true;
      }
    }
  }

  return anySent;
}

export async function checkAndSendReminders(guild: Guild): Promise<{ sent: number }> {
  try {
    const allDeadlines = loadDeadlines(guild.id);
    let sentCount = 0;

    for (const deadline of allDeadlines) {
      const sent = await processDeadlineReminders(guild, deadline);
      if (sent) sentCount++;
    }

    if (sentCount > 0) saveDeadlines(guild.id, allDeadlines);

    return { sent: sentCount };
  } catch (error) {
    console.error('Error checking reminders:', error);
    return { sent: 0 };
  }
}

export function startReminderJob(
  client: Client,
  intervalMinutes: number = 30
): void {
  if (reminderInterval) {
    console.log('Reminder job already running');
    return;
  }

  const intervalMs = intervalMinutes * 60 * 1000;
  console.log(`Starting reminder job (every ${intervalMinutes} minutes)`);

  reminderInterval = setInterval(async () => {
    try {
      for (const guild of client.guilds.cache.values())
        await checkAndSendReminders(guild);
    } catch (error) {
      console.error('Error in reminder job:', error);
    }
  }, intervalMs)
}

export function stopReminderJob() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('Stopped reminder job');
  }
}
