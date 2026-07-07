import { Events, Client, type Interaction } from 'discord.js';
import { markGuildRemoved, clearGuildRemoved } from '../storage/storageHelpers.js';

export async function handleCommandInteraction(interaction: Interaction, client: Client): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.handle(interaction);
  } catch (e) {
    console.error(`Error in ${interaction.commandName}:`, e);
  }
}

export function setupInteractionHandler(client: Client): void {
  client.on(Events.InteractionCreate, async interaction => {
    await handleCommandInteraction(interaction, client);
  });
}

export async function handleGuildDelete(guild: { id: string }): Promise<void> {
  try {
    markGuildRemoved(guild.id);
    console.log(`Marked guild ${guild.id} for data removal in 30 days`);
  } catch (e) {
    console.error(`Failed to mark guild ${guild.id} for removal:`, e);
  }
}

export async function handleGuildCreate(guild: { id: string }): Promise<void> {
  try {
    clearGuildRemoved(guild.id);
  } catch (e) {
    console.error(`Failed to clear removal marker for guild ${guild.id}:`, e);
  }
}

export function setupGuildDeleteHandler(client: Client): void {
  client.on(Events.GuildDelete, handleGuildDelete);
  client.on(Events.GuildCreate, handleGuildCreate);
}
