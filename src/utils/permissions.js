const { replyEphemeral } = require('./interactions');

function hasPermission(interaction) {
  const hasHelper = interaction.member.roles.cache.some(
    role => role.name === process.env.HELPER_ROLE_NAME
  );
  if (hasHelper) return true;

  return interaction.member.permissions.has('Administrator');
}

async function denyPermission(interaction) {
   return replyEphemeral(interaction, `You need the ${process.env.HELPER_ROLE_NAME} role to use this.`);
}

module.exports = { hasPermission, denyPermission };
