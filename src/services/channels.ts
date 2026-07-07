import {
  type GuildBasedChannel,
  type Snowflake,
  ChannelType,
  Collection,
  ForumChannel,
  Guild,
  TextChannel
} from 'discord.js';

type EligibleChannel = TextChannel | ForumChannel;
type EligibleChannels = Collection<Snowflake, EligibleChannel>;

function getEligibleChannels(guild: Guild): EligibleChannels {
  return guild.channels.cache.filter(c =>
    c.type === ChannelType.GuildText || c.type === ChannelType.GuildForum
  );
}

function tryResolveById(
  channels: EligibleChannels,
  input: string
): EligibleChannel | null {
  const idMatch = input.match(/^<#(\d+)>$/);
  if (!idMatch || !idMatch[1]) return null;
  return channels.get(idMatch[1]) ?? null;
}

function normalizeInput(input: string): string {
  return input.toLowerCase().trim();
}

function tryExactMatch(
  channels: EligibleChannels,
  input: string
): EligibleChannel | "DUPLICATE" | null {
  const normalizedInput = normalizeInput(input);

  // Exact Match
  const exactMatches = channels.filter(c =>
    c.name.toLowerCase() === normalizedInput.replace(/\s+/g, '-')
  );

  if (exactMatches.size === 1) return exactMatches.first() ?? null;
  if (exactMatches.size > 1)   return "DUPLICATE";
  return null;
}

function tryKeywordMatch(
  channels: EligibleChannels,
  input: string
): EligibleChannel | "DUPLICATE" | null {
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

export function resolveChannel(
  guild: Guild | null | undefined,
  courseInput: string | null | undefined
): EligibleChannel | "DUPLICATE" | null {
  if (!courseInput || !guild) return null;

  const channels = getEligibleChannels(guild);

  const byId = tryResolveById(channels, courseInput);
  if (byId !== null) return byId;

  const exact = tryExactMatch(channels, courseInput);
  if (exact !== null) return exact;

  return tryKeywordMatch(channels, courseInput);
}

export const isForumChannel = (
  channel: GuildBasedChannel | null | undefined
): channel is ForumChannel => channel?.type === ChannelType.GuildForum;

export const isTextChannel = (
  channel: GuildBasedChannel | null | undefined
): channel is TextChannel => channel?.type === ChannelType.GuildText;
