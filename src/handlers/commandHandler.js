const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

function getCommandFiles(commandsPath) {
  return fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
}

function validateCommand(command, filePath) {
  if (!command)
    throw new Error(`Invalid command module: ${filePath}`);

  if (!command.name)
    throw new Error(`Command missing name: ${filePath}`);

  if (!command.data) 
    throw new Error(`Command missing data: ${filePath}`);

  if (typeof command.handle !== 'function') 
    throw new Error(`Command missing handle(): ${filePath}`);
}

function loadCommand(filePath) {
  const command = require(filePath);
  validateCommand(command, filePath);
  return command;
}

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = getCommandFiles(commandsPath);
  const commandData = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = loadCommand(filePath);
  
    if (client.commands.has(command.name))
      throw new Error(`Duplicate command name '${command.name}' in ${filePath}`);

    client.commands.set(command.name, command);
    commandData.push(command.data);
  }

  return commandData;
}

async function registerCommands(client, commandData) {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID)
    : Routes.applicationCommands(client.user.id);

  await rest.put(route, { body: commandData });
}

module.exports = { validateCommand, loadCommands, registerCommands };
