const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  const commandData = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    client.commands.set(command.name, command);
    commandData.push(command.data);
  }

  return commandData;
}

async function registerCommands(client, commandData) {
  const rest = new REST({version: '10'}).setToken(process.env.DISCORD_TOKEN);

  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID)
    : Routes.applicationCommands(client.user.id);

  await rest.put(route, { body: commandData });
}

module.exports = { loadCommands, registerCommands };
