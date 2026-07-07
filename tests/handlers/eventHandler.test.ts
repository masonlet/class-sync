import { handleCommandInteraction, handleGuildDelete } from '../../src/handlers/eventHandler.js';
import * as storageHelpers                             from '../../src/storage/storageHelpers.js';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock, type MockInstance } from 'vitest';
import type { Client, Interaction } from 'discord.js';

type MockCommand = { handle: Mock };
type MockInteraction = { isChatInputCommand: Mock; commandName: string };

describe('event handler', () => {
  describe('handleCommandInteraction', () => {
    let mockClient: Client;
    let mockInteraction: MockInteraction;
    let mockCommand: MockCommand;
    let consoleErrorSpy: MockInstance;

    const asInteraction = (i: MockInteraction): Interaction => i as unknown as Interaction;

    beforeEach(() => {
      mockCommand = { handle: vi.fn() };
      mockClient = { commands: new Map([['test', mockCommand]]) } as unknown as Client;
      mockInteraction = {
        isChatInputCommand: vi.fn(() => true),
        commandName: 'test'
      };
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should execute command when interaction is valid', async () => {
      await handleCommandInteraction(asInteraction(mockInteraction), mockClient);
      expect(mockCommand.handle).toHaveBeenCalledWith(mockInteraction);
    });

    it('should ignore non-chat-input commands', async () => {
      mockInteraction.isChatInputCommand.mockReturnValue(false);
      await handleCommandInteraction(asInteraction(mockInteraction), mockClient);
      expect(mockCommand.handle).not.toHaveBeenCalled();
    });

    it('should ignore unknown commands', async () => {
      mockInteraction.commandName = 'unknown';
      await handleCommandInteraction(asInteraction(mockInteraction), mockClient);
      expect(mockCommand.handle).not.toHaveBeenCalled();
    });

    it('should log errors when command execution fails', async () => {
      const error = new Error('Command failed');
      mockCommand.handle.mockRejectedValue(error);
      await handleCommandInteraction(asInteraction(mockInteraction), mockClient);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in test:', error);
    });
  });

  describe('handleGuildDelete', () => {
    let consoleLogSpy: MockInstance;
    let consoleErrorSpy: MockInstance;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it('deletes guild data on removal', async () => {
      const spy = vi.spyOn(storageHelpers, 'deleteGuildData').mockImplementation(() => {});
      await handleGuildDelete({ id: 'guild-1' });
      expect(spy).toHaveBeenCalledWith('guild-1');
      expect(consoleLogSpy).toHaveBeenCalledWith('Removed data for guild guild-1');
    });

    it('logs error when deletion fails', async () => {
      const error = new Error('rm failed');
      vi.spyOn(storageHelpers, 'deleteGuildData').mockImplementation(() => { throw error; });
      await handleGuildDelete({ id: 'guild-1' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to remove data for guild guild-1:', error);
    });
  });
});
