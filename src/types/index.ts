import { Role, APIRole, TextChannel, ThreadChannel } from "discord.js";

export type CommandInputs = {
  course: string | null;
  cohort: Role | APIRole | null;
  assignment: string | null;
  date: string | null;
};

export type ValidationResult = { valid: boolean; error?: string };

export type Channel = TextChannel | ThreadChannel;

export type Deadline = {
  courseChannelId: string;
  cohortId: string;
  assignment: string;
  dueDate?: string;
};


