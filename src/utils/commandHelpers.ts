import {
  type APIRole,
  ChatInputCommandInteraction,
  Role
} from "discord.js";
import type {
  CommandInputs,
  ValidationResult,
  Channel,
  Deadline
} from "../types"
import { isLimited, getRemainingTime } from "./ratelimiter";
import { replyEphemeral } from "./interactions";

export function extractCommandInputs(
  interaction: ChatInputCommandInteraction
): CommandInputs {
  return {
    course: interaction.options.getString("course"),
    cohort: interaction.options.getRole("cohort"),
    assignment: interaction.options.getString("assignment"),
    date: interaction.options.getString("date")
  };
}

export function validateChannelResolution(
  channel: Channel | "DUPLICATE" | null
): ValidationResult {
  if (!channel) return { 
    valid: false, 
    error: "Channel not found."
  };

  if (channel === "DUPLICATE") return { 
    valid: false, 
    error: "Multiple channels found."
  };

  return { valid: true };
}

export function validateChannelFilter(
  channel: Channel | "DUPLICATE" | null
): ValidationResult {
  if (channel === "DUPLICATE") return { 
    valid: false, 
    error: "Multiple channels match your filter. Please be more specific."
  };
  
  return { valid: true };
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
