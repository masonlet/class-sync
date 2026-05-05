import {
  type APIRole,
  ChatInputCommandInteraction,
  Role
} from "discord.js";
import type {
  CommandInputs,
  Channel,
  Deadline
} from "../types"
import { isLimited, getRemainingTime } from "./ratelimiter";
import { replyEphemeral } from "./interactions";

export function extractCommandInputs(
  interaction: ChatInputCommandInteraction
): CommandInputs {
  return {
    course: interaction.options.getString("course", true),
    cohort: interaction.options.getRole("cohort", true),
    assignment: interaction.options.getString("assignment", true),
    date: interaction.options.getString("date", true)
  };
}

export function isValidChannel(
  channel: Channel | "DUPLICATE" | null
): channel is Channel {
  return !!channel && channel !== "DUPLICATE";
}

export function isValidChannelFilter(
  channel: Channel | "DUPLICATE" | null
): channel is Channel | null {
  return channel !== "DUPLICATE";
}

export function findDeadline(
  deadlines: (Deadline | undefined)[], 
  channel: Channel | null, 
  cohort: Role | APIRole | null, 
  assignment: string | null
): Deadline | undefined {
  if (!channel || !cohort) return undefined;

  return deadlines.find(d => d &&
    d.courseChannelId === channel.id &&
    d.cohortId === cohort.id &&
    d.assignment === assignment
  );
}

export async function checkRateLimit(
  interaction: ChatInputCommandInteraction
): Promise<boolean> {
  const userId = interaction.user.id;
  const commandName = interaction.commandName;
  if (isLimited(userId, commandName)) {
    const remaining = getRemainingTime(userId, commandName);
    await replyEphemeral(interaction, `Slow down! Try again in ${remaining} seconds.`);
    return false;
  }
  return true;
}
