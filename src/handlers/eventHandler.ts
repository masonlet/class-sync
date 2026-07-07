import { Events, Client, type Interaction } from 'discord.js';
import { deleteGuildData } from '../storage/storageHelpers.js';

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

export function setupGuildDeleteHandler(client: Client): void {
  client.on(Events.GuildDelete, guild => {
    try {
      deleteGuildData(guild.id);
      console.log(`Removed data for guild ${guild.id}`);
    } catch (e) {
      console.error(`Failed to remove data for guild ${guild.id}:`, e);
    }
  });
}
