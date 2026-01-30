import "dotenv/config";
import { REST, Routes } from 'discord.js';
import { loadCommands } from './src/handlers/commandHandler.js';

const commands = await loadCommands(null);

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const route = process.env.GUILD_ID
        ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
        : Routes.applicationCommands(process.env.CLIENT_ID);

    const data = await rest.put(route, { body: commands });

   const scope = process.env.GUILD_ID ? 'guild' : 'global';
    console.log(`Successfully reloaded ${data.length} ${scope} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
