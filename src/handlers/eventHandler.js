const { Events } = require('discord.js');

async function handleCommandInteraction(interaction, client) {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.handle(interaction);
  } catch (error) {
    console.error(`Error in ${interaction.commandName}:`, error);
  }
}

function setupInteractionHandler(client) {
  client.on(Events.InteractionCreate, async interaction => {
    await handleCommandInteraction(interaction, client);
  });
}

module.exports = { setupInteractionHandler };
