import { ChannelType } from "discord.js";
import type { Guild, ThreadChannel } from "discord.js";
import type { Channel } from "../../src/types";
import { vi } from "vitest";
import type { Mock } from "vitest";

export type MockChannelInternals = {
  threads: { create: Mock; fetchActive: Mock };
  messages: { fetch: Mock };
  send: Mock;
};
export type MockGuildInternals = {
  channels: { fetch: Mock; create: Mock };
};

export const asMockChannel = (c: Channel): MockChannelInternals =>
  c as unknown as MockChannelInternals;
export const asMockGuild = (g: Guild): MockGuildInternals =>
  g as unknown as MockGuildInternals;
export const asMockThread = (t: ThreadChannel): { fetchStarterMessage: Mock } =>
  t as unknown as { fetchStarterMessage: Mock };

export class MockCollection<K, V> extends Map<K, V> {
  filter(fn: (value: V, key: K, collection: this) => boolean): MockCollection<K, V> {
    const out = new MockCollection<K, V>();
    for (const [k, v] of this) if (fn(v, k, this)) out.set(k, v);
    return out;
  }

  find(fn: (value: V, key: K, collection: this) => boolean): V | undefined {
    for (const [k, v] of this) if (fn(v, k, this)) return v;
    return undefined;
  }

  first(): V | undefined {
    return this.values().next().value;
  }
}

export const makeChannel = (
  id: string,
  name: string,
  type: ChannelType = ChannelType.GuildText,
  parentId: string | null = null
): Channel => ({
  id,
  name,
  type,
  parentId,
  isTextBased: vi.fn(() => type === ChannelType.GuildText || type === ChannelType.GuildForum),
  threads: {
    create: vi.fn(),
    fetchActive: vi.fn(),
  },
  messages: {
    fetch: vi.fn(),
  },
  send: vi.fn(),
} as unknown as Channel);

export const makeThread = (id: string, name: string): ThreadChannel => ({
  id,
  name,
  fetchStarterMessage: vi.fn(),
} as unknown as ThreadChannel);

export const makeGuild = (channels: Channel[] = []): Guild => ({
  id: "guild123",
  channels: {
    cache: new MockCollection<string, Channel>(channels.map(c => [c.id, c] as const)),
    fetch: vi.fn(),
    create: vi.fn(),
  },
} as unknown as Guild);
