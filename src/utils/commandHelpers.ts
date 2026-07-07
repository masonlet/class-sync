import { type APIRole, ChatInputCommandInteraction, Role } from "discord.js";
import type { CommandInputs, Channel, Deadline } from "../types.js"
import { isLimited, getRemainingTime           } from "./ratelimiter.js";
import { replyEphemeral                        } from "./interactions.js";

export function extractCommandInputs(interaction: ChatInputCommandInteraction): CommandInputs {
  return {
    course:     interaction.options.getString("course",     true),
    cohort:     interaction.options.getRole  ("cohort",     true),
    assignment: interaction.options.getString("assignment", true),
    date:       interaction.options.getString("date",       true)
  };
}

export async function checkRateLimit(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (isLimited(interaction.user.id, interaction.commandName)) {
    const remaining = getRemainingTime(interaction.user.id, interaction.commandName);
    await replyEphemeral(interaction, `Slow down! Try again in ${remaining} seconds.`);
    return false;
  }
  return true;
}

export function isValidChannel(channel: Channel | "DUPLICATE" | null): channel is Channel {
  return !!channel && channel !== "DUPLICATE";
}

export function isValidChannelFilter(channel: Channel | "DUPLICATE" | null): channel is Channel | null {
  return channel !== "DUPLICATE";
}

export function findDeadline(
  deadlines: (Deadline | undefined)[],
  channel:    Channel | null, 
  cohort:     Role | APIRole | null,
  assignment: string | null
): Deadline | undefined {
  if (!channel || !cohort) return undefined;

  return deadlines.find(d => d
      && d.courseChannelId === channel.id
      && d.cohortId        === cohort.id
      && d.assignment      === assignment
  );
}
