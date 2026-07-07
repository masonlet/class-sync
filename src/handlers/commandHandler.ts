import fs                from "node:fs";
import path              from "node:path";
import { pathToFileURL } from "node:url";
import { Client       } from "discord.js";
import type { Command } from "../types.js";

function getCommandFiles(commandsPath: string): string[] {
  return fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
}

export function validateCommand(command: unknown, filePath: string): asserts command is Command {
  if (!command || typeof command !== 'object') throw new Error(`Invalid command module: ${filePath}`);

  const c = command as Partial<Command>;
  if (!c.name)                        throw new Error(`Command missing name: ${filePath}`);
  if (!c.data)                        throw new Error(`Command missing data: ${filePath}`);
  if (typeof c.handle !== 'function') throw new Error(`Command missing handle(): ${filePath}`);
}

async function loadCommand(filePath: string): Promise<Command> {
  const url     = pathToFileURL(filePath).href;
  const mod     = await import(url);
  const command = mod.default ?? mod;
  validateCommand(command, filePath);
  return command;
}

export async function loadCommands(client: Client | null | undefined): Promise<Command['data'][]> {
  const commandsPath = path.join(import.meta.dirname, '..', 'commands');
  const commandFiles = getCommandFiles(commandsPath);
  const commandData: Command['data'][] = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await loadCommand(filePath);

    if(client) {
      if (client.commands.has(command.name)) throw new Error(
        `Duplicate command name '${command.name}' in ${filePath}`
      );

      client.commands.set(command.name, command);
    }

    commandData.push(command.data);
  }

  return commandData;
}
