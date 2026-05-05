import {
  type APIRole,
  ChatInputCommandInteraction,
  Collection,
  Role,
  SlashCommandBuilder,
  TextChannel,
  ThreadChannel
} from "discord.js";

export type Command = {
  name: string;
  data: SlashCommandBuilder;
  handle: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}

export type CommandInputs = {
  course: string | null;
  cohort: Role | APIRole | null;
  assignment: string | null;
  date: string | null;
};

export type ValidationResult = { valid: boolean; error?: string };

export type Channel = TextChannel | ThreadChannel;

export type ReminderType = "24h" | "8h" | "1h";
export type RemindersSent = Record<ReminderType, boolean>;

export type Deadline = {
  id: string;
  courseChannelId: string;
  courseChannelName: string;
  cohortId: string;
  reminderLocationId: string;
  assignment: string;
  dueDate: string;
  remindersSent?: RemindersSent;
};


