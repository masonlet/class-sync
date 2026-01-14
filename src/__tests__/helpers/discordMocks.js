const { ChannelType } = require('discord.js');

class MockCollection extends Map {
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

const makeChannel = (
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
    create: jest.fn(),
    fetchActive: jest.fn(),
  },
  messages: {
    fetch: jest.fn(),
  },
  send: jest.fn(),
});

const makeThread = (id, name) => ({
  id,
  name,
  fetchStarterMessage: jest.fn(),
});

const makeGuild = (channels = []) => ({
  channels: {
    cache: new MockCollection(channels.map(c => [c.id, c])),
    fetch: jest.fn(),
    create: jest.fn(),
  },
});

module.exports = {
  MockCollection,
  makeChannel,
  makeThread,
  makeGuild,
}
