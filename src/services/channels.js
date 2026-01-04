const { ChannelType } = require('discord.js');

function resolveChannel(guild, courseInput) {
  if (!courseInput || !guild) return null;

  const channels = guild.channels.cache.filter(c =>
    c.type === ChannelType.GuildText || c.type === ChannelType.GuildForum
  );

  // Check Mention <#ID> or Raw ID
  const idMatch = courseInput.match(/^<#(\d+)>$/);
  if (idMatch) return channels.get(idMatch[1]) || null;

  const normalizedInput = courseInput.toLowerCase().trim();

  // Exact Match
  const exactMatches = channels.filter(c => c.name.toLowerCase() === normalizedInput.replace(/\s+/g, '-'));
  if (exactMatches.size === 1) return exactMatches.first();
  if (exactMatches.size > 1) return "DUPLICATE";
  
  // Smart Search (Spit into keywords and check for matches)
  const inputKeywords = normalizedInput 
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (inputKeywords.length === 0) return null;

  const keywordMatches = channels.filter(channel => {
    const normalizedName = channel.name.toLowerCase().replace(/-/g, ' ');    
    return inputKeywords.every(keyword => normalizedName.includes(keyword));
  });

  if (keywordMatches.size > 1) return "DUPLICATE";

  return keywordMatches.first() || null;
}

const isForumChannel = (channel) => channel?.type === ChannelType.GuildForum;
const isTextChannel = (channel) => channel?.type === ChannelType.GuildText;

module.exports = { resolveChannel, isForumChannel, isTextChannel };
