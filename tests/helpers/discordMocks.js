import { ChannelType } from 'discord.js';
import { vi } from 'vitest';

export class MockCollection extends Map {
  filter(fn) {
    const out = new MockCollection();
    for (const [k, v] of this) if (fn(v, k, this)) out.set(k, v);
    return out;
  }

  find(fn) {
    for (const [k, v] of this) if (fn(v, k, this)) return v;
    return undefined;
  }

  first() {
    return this.values().next().value;
  }
}

export const makeChannel = (
  id,
  name,
  type = ChannelType.GuildText,
  parentId = null
) => ({
  id,
  name,
  type,
  parentId,
  threads: {
    create: vi.fn(),
    fetchActive: vi.fn(),
  },
  messages: {
    fetch: vi.fn(),
  },
  send: vi.fn(),
});

export const makeThread = (id, name) => ({
  id,
  name,
  fetchStarterMessage: vi.fn(),
});

export const makeGuild = (channels = []) => ({
  id: 'guild123',
  channels: {
    cache: new MockCollection(channels.map(c => [c.id, c])),
    fetch: vi.fn(),
    create: vi.fn(),
  },
});
