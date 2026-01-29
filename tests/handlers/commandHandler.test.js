const { validateCommand } = require('../../src/handlers/commandHandler');

describe('validateCommand', () => {
  const mockPath = '/commands/test.js';

  it('should throw when command is null or undefined', () => {
    expect(() => validateCommand(null, mockPath))
      .toThrow('Invalid command module: /commands/test.js');
  });

  it('should throw when command missing name', () => {
    expect(() => validateCommand({ data: {}, handle: jest.fn() }, mockPath))
      .toThrow('Command missing name: /commands/test.js');
  });

  it('should throw when command missing data', () => {
    expect(() => validateCommand({ name: 'test', handle: jest.fn() }, mockPath))
      .toThrow('Command missing data: /commands/test.js');
  });

  it('should throw when handle is not a function', () => {
    expect(() => validateCommand({ name: 'test', data: {}, handle: 'bad' }, mockPath))
      .toThrow('Command missing handle(): /commands/test.js');
  });

  it('should not throw for valid command', () => {
    expect(() => validateCommand({ 
      name: 'test', 
      data: {}, 
      handle: jest.fn() 
    }, mockPath)).not.toThrow();
  });
});
