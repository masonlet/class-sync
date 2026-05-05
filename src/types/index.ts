import {
  type APIRole,
  ChatInputCommandInteraction,
  Collection,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  Role,
  TextChannel,
  ForumChannel
} from "discord.js";

export type ValidationResult =
| { valid: true }
| { valid: false; error: string };

export type Channel = TextChannel | ForumChannel;

export type ReminderType = "24h" | "8h" | "1h";
export type RemindersSent = Record<ReminderType, boolean>;

export type Deadline = {
  id: string;
  courseChannelId: string;
  courseChannelName: string;
  cohortId: string;
  cohortName: string;
  reminderLocationId: string;
  assignment: string;
  dueDate: string;
  remindersSent?: RemindersSent;
};

export type Command = {
  name: string;
  data: RESTPostAPIChatInputApplicationCommandsJSONBody;
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
