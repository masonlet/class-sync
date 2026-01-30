import { Events } from 'discord.js';

export async function handleCommandInteraction(interaction, client) {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.handle(interaction);
  } catch (error) {
    console.error(`Error in ${interaction.commandName}:`, error);
  }
}

export function setupInteractionHandler(client) {
  client.on(Events.InteractionCreate, async interaction => {
    await handleCommandInteraction(interaction, client);
  });
}
