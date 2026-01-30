import { SlashCommandBuilder } from 'discord.js';
import { replyEphemeral } from '../utils/interactions.js';

export const name = 'status';

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Check if bot is working')
  .toJSON();
  
export async function handle(interaction) {
  return replyEphemeral(interaction, 'Bot is working');
}
