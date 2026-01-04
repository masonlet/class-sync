const { MessageFlags } = require('discord.js');

// Discord REST error codes:
// 10062 = Unknown interaction (expired token / invalid interaction)
// 40060 = Interaction already acknowledged

async function deferEphemeral(interaction) {
  if (interaction.deferred || interaction.replied) return;
  
  try {
    return await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  } catch (error) {
    if (error?.code === 10062 || error?.code === 40060) 
      return;

    throw error;
  }
}

async function replyEphemeral(interaction, content) {
  try {
    if (interaction.deferred || interaction.replied) 
      return await interaction.editReply({ content });

    return await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  } catch (error) {
    if (error?.code === 10062 || error?.code === 40060) 
      return;

    throw error;
  }
}

module.exports = {
  deferEphemeral,
  replyEphemeral
};
