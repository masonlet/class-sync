import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getCommandFiles(commandsPath) {
  return fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
}

export function validateCommand(command, filePath) {
  if (!command) 
    throw new Error(`Invalid command module: ${filePath}`);

  if (!command.name)
    throw new Error(`Command missing name: ${filePath}`);

  if (!command.data) 
    throw new Error(`Command missing data: ${filePath}`);

  if (typeof command.handle !== 'function') 
    throw new Error(`Command missing handle(): ${filePath}`);
}

async function loadCommand(filePath) {
  const url = pathToFileURL(filePath).href;

  const mod = await import(url);
  const command = mod.default ?? mod;

  validateCommand(command, filePath);
  return command;
}

export async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = getCommandFiles(commandsPath);
  const commandData = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await loadCommand(filePath);
  
    if(client) {
      if (client.commands.has(command.name))
        throw new Error(`Duplicate command name '${command.name}' in ${filePath}`);

      client.commands.set(command.name, command);
    }

    commandData.push(command.data);
  }

  return commandData;
}
