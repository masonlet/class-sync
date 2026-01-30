import { replyEphemeral } from './interactions.js';

export function hasPermission(interaction) {
  if (interaction.member.roles.cache) {
    const hasHelper = interaction.member.roles.cache.some(
      role => role.name === process.env.HELPER_ROLE_NAME
    );
    if (hasHelper) return true;
  }

  if (interaction.member.permissions) {
    return interaction.member.permissions.has('Administrator');
  }

  return false;
}

export async function denyPermission(interaction) {
   return replyEphemeral(interaction, `You need the ${process.env.HELPER_ROLE_NAME} role to use this.`);
}
