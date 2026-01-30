import { ChannelType } from 'discord.js';

function getEligibleChannels(guild) {
  return guild.channels.cache.filter(c =>
    c.type === ChannelType.GuildText || c.type === ChannelType.GuildForum
  );
}

function tryResolveById(channels, input) {
  const idMatch = input.match(/^<#(\d+)>$/);
  if (!idMatch) return null;
  return channels.get(idMatch[1]) || null;
}

function normalizeInput(input) {
  return input.toLowerCase().trim();
}

function tryExactMatch(channels, input) {
  const normalizedInput = normalizeInput(input);

  // Exact Match
  const exactMatches = channels.filter(c => 
    c.name.toLowerCase() === normalizedInput.replace(/\s+/g, '-')
  );

  if (exactMatches.size === 1) return exactMatches.first();
  if (exactMatches.size > 1) return "DUPLICATE";
  return null;
}

function tryKeywordMatch(channels, input) {
  const normalized = normalizeInput(input);
  const inputKeywords = normalized
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

export function resolveChannel(guild, courseInput) {
  if (!courseInput || !guild) return null;

  const channels = getEligibleChannels(guild);

  const byId = tryResolveById(channels, courseInput);
  if (byId !== null) return byId;

  const exact = tryExactMatch(channels, courseInput);
  if (exact !== null) return exact;

  return tryKeywordMatch(channels, courseInput);
}

export const isForumChannel = (channel) => channel?.type === ChannelType.GuildForum;
export const isTextChannel = (channel) => channel?.type === ChannelType.GuildText;
