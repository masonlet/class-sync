import { 
  ChatInputCommandInteraction, 
  GuildMember, 
  PermissionsBitField 
} from "discord.js";
import { replyEphemeral } from "./interactions";

export function hasPermission(
  interaction: ChatInputCommandInteraction
): boolean {
  const member = interaction.member;
  if (!(member instanceof GuildMember)) return false;

  const hasHelper = member.roles.cache.some(
    role => role.name === process.env.HELPER_ROLE_NAME
  );
  if (hasHelper) return true;

  return member.permissions.has("Administrator");
}

export async function denyPermission(
  interaction: ChatInputCommandInteraction
): Promise<void> {
   await replyEphemeral(interaction, `You need the ${process.env.HELPER_ROLE_NAME} role to use this.`);
}
