import { isLimited, getRemainingTime } from '../utils/ratelimiter.js';
import { replyEphemeral } from './interactions.js';

export function extractCommandInputs(interaction) {
  return {
    course: interaction.options.getString('course'),
    cohort: interaction.options.getRole('cohort'),
    assignment: interaction.options.getString('assignment'),
    date: interaction.options.getString('date')
  };
}

export function validateChannelResolution(channel) {
  if (!channel)
    return { valid: false, error: 'Channel not found.' };

  if (channel === "DUPLICATE") 
    return { valid: false, error: 'Multiple channels found.' };

  return { valid: true };
}

export function validateChannelFilter(channel) {
  if (channel === "DUPLICATE")
    return { valid: false, error: 'Multiple channels match your filter. Please be more specific.' };
  
  return { valid: true };
}

export function findDeadline(deadlines, channel, cohort, assignment) {
  if (!channel || !cohort) return undefined;

  return deadlines.find(d => d &&
    d.courseChannelId === channel.id &&
    d.cohortId === cohort.id &&
    d.assignment === assignment
  );
}

export async function checkRateLimit(interaction) {
  const userId = interaction.user.id;
  const commandName = interaction.commandName;
  if (isLimited(userId, commandName)) {
    const remaining = getRemainingTime(userId, commandName);
    return replyEphemeral(interaction, `Slow down! Try again in ${remaining} seconds.`);
  }
  return true;
}
