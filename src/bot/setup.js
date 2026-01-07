const { Events } = require('discord.js');
const { loadCommands, registerCommands } = require('../handlers/commandHandler');
const { setupInteractionHandler } = require('../handlers/eventHandler');

function setupBot(client) {
  const commandData = loadCommands(client);
  setupInteractionHandler(client);

  client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
      console.log('Registering slash commands');
      await registerCommands(client, commandData);
    } catch (error) {
      console.error('Error registering commands:', error);
    }

    console.log(`Startup finished`);
  });
}

module.exports = { setupBot };
