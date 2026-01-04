const { MessageFlags } = require('discord.js');

function hasPermission(interaction) {
  const hasHelper = interaction.member.roles.cache.some(role => role.name === process.env.HELPER_ROLE_NAME);
  const hasAdmin = interaction.member.permissions.has('Administrator');
  return hasHelper || hasAdmin;
}

async function denyPermission(interaction) {
  const content = `You need the ${process.env.HELPER_ROLE_NAME} role to use this.`;

  if (interaction.deferred) {
    return interaction.editReply({
      content: content,
      flags: MessageFlags.Ephemeral
    });
  }

  return interaction.reply({
    content: content,
    flags: MessageFlags.Ephemeral
  });
}

module.exports = { hasPermission, denyPermission };
