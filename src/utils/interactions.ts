import { MessageFlags, ChatInputCommandInteraction } from "discord.js";

// Discord REST error codes:
// 10062 = Unknown interaction (expired token / invalid interaction)
// 40060 = Interaction already acknowledged

function isDiscordError(error: unknown): error is { code: number } {
  return typeof error === "object"
      && error !== null
      && "code" in error
      && typeof error.code === "number";
}

export async function deferEphemeral(interaction: ChatInputCommandInteraction): Promise<void> {
  if (interaction.deferred || interaction.replied) return;
  
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  } catch (error) {
    if (isDiscordError(error) && (error.code === 10062 || error.code === 40060)) return;
    throw error;
  }
}

export async function replyEphemeral(interaction: ChatInputCommandInteraction, content: string): Promise<void> {
  try {
    if (interaction.deferred || interaction.replied) { 
      await interaction.editReply({ content });
      return;
    }
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  } catch (error) {
    if (isDiscordError(error) && (error.code === 10062 || error.code === 40060)) return;
    throw error;
  }
}
