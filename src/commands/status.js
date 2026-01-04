const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  name: 'status',
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check if bot is working')
    .toJSON(),

  async handle(interaction) {
    await interaction.reply({ content: 'Bot is working', flags: MessageFlags.Ephemeral });
  }
};
