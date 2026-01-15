const { handleCommandInteraction } = require('../../handlers/eventHandler');

describe('handleCommandInteraction', () => {
  let mockClient;
  let mockInteraction;
  let mockCommand;
  let consoleErrorSpy;

  beforeEach(() => {
    mockCommand = { handle: jest.fn() };
    mockClient = { commands: new Map([['test', mockCommand]]) };
    mockInteraction = {
      isChatInputCommand: jest.fn(() => true),
      commandName: 'test'
    };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should execute command when interaction is valid', async () => {
    await handleCommandInteraction(mockInteraction, mockClient);
    
    expect(mockCommand.handle).toHaveBeenCalledWith(mockInteraction);
  });

  it('should ignore non-chat-input commands', async () => {
    mockInteraction.isChatInputCommand.mockReturnValue(false);
    
    await handleCommandInteraction(mockInteraction, mockClient);
    
    expect(mockCommand.handle).not.toHaveBeenCalled();
  });

  it('should ignore unknown commands', async () => {
    mockInteraction.commandName = 'unknown';
    
    await handleCommandInteraction(mockInteraction, mockClient);
    
    expect(mockCommand.handle).not.toHaveBeenCalled();
  });

  it('should log errors when command execution fails', async () => {
    const error = new Error('Command failed');
    mockCommand.handle.mockRejectedValue(error);
    
    await handleCommandInteraction(mockInteraction, mockClient);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error in test:', error);
  });
});
