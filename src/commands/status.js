const { SlashCommandBuilder } = require('discord.js');
const { replyEphemeral } = require('../utils/interactions');

module.exports = {
  name: 'status',
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check if bot is working')
    .toJSON(),

  async handle(interaction) {
    return replyEphemeral(interaction, 'Bot is working');
  }
};
