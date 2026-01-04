const { Events } = require('discord.js');

function setupInteractionHandler(client) {
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.handle(interaction);
    } catch (error) {
      console.error(`Error in ${interaction.commandName}:`, error);
    }
  });
}

module.exports = { setupInteractionHandler };
