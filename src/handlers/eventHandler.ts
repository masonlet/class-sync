import { Events, Client, type Interaction } from 'discord.js';

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
