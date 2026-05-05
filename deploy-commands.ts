import "dotenv/config";
import { REST, Routes } from "discord.js";
import { loadCommands } from "./src/handlers/commandHandler";

const token = process.env["DISCORD_TOKEN"];
const clientId = process.env["CLIENT_ID"];
const guildId = process.env["GUILD_ID"];
if (!token) throw new Error("DISCORD_TOKEN is not set");
if (!clientId) throw new Error("CLIENT_ID is not set");

const commands = await loadCommands(null);
const rest = new REST().setToken(token);

try {
  console.log(`Started refreshing ${commands.length} application (/) commands.`);

  const route = guildId
      ? Routes.applicationGuildCommands(clientId, guildId)
      : Routes.applicationCommands(clientId);

  const data = (await rest.put(route, { body: commands })) as unknown[];

  const scope = guildId ? "guild" : "global";
  console.log(`Successfully reloaded ${data.length} ${scope} application (/) commands.`);
} catch (e) {
  console.error(e);
}
