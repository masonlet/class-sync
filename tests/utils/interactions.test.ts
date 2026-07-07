import { vi, describe, it, expect } from 'vitest';
import { MessageFlags             } from 'discord.js';
import { makeInteraction                } from '../helpers/interactions.js';
import { expectIgnoreErrorCode          } from '../helpers/assertions.js';
import { deferEphemeral, replyEphemeral } from '../../src/utils/interactions.js';

describe('interactions', () => {
  describe('deferEphemeral()', () => {
    it('defers reply when interaction is fresh', async () => {
      const interaction = makeInteraction();
      await deferEphemeral(interaction);

      expect(interaction.deferReply).toHaveBeenCalledWith({
        flags: MessageFlags.Ephemeral 
      });
    });

    it('skips when interaction already deferred', async () => {
      const interaction = makeInteraction({ deferred: true });
      const result = await deferEphemeral(interaction);
      expect(interaction.deferReply).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('skips when interaction already replied', async () => {
      const interaction = makeInteraction({ replied: true });
      const result = await deferEphemeral(interaction);
      expect(interaction.deferReply).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('catches error code 10062 (unknown interaction)', async () => {
      const interaction = makeInteraction();
      vi.mocked(interaction.deferReply).mockRejectedValue({ code: 10062 });
      await expectIgnoreErrorCode(() => deferEphemeral(interaction));
    });

    it('catches error code 40060 (already acknowledged)', async () => {
      const interaction = makeInteraction();
      vi.mocked(interaction.deferReply).mockRejectedValue({ code: 40060 });
      await expect(deferEphemeral(interaction)).resolves.toBeUndefined();
    });

    it('rethrows unknown errors', async () => {
      const interaction = makeInteraction();
       vi.mocked(interaction.deferReply).mockRejectedValue(new Error('Network failure'));
      await expect(deferEphemeral(interaction)).rejects.toThrow('Network failure');
    });
  });

  describe('replyEphemeral()', () => {
    it('replies when interaction is fresh', async () => {
      const interaction = makeInteraction();
      await replyEphemeral(interaction, 'Test message');
      expect(interaction.reply).toHaveBeenCalledWith({
        content: 'Test message',
        flags: MessageFlags.Ephemeral
      });
    });

    it('edits reply when interaction already deferred', async () => {
      const interaction = makeInteraction({ deferred: true });
      await replyEphemeral(interaction, 'Deferred message');
      expect(interaction.editReply).toHaveBeenCalledWith({ 
        content: 'Deferred message' 
      });
      expect(interaction.reply).not.toHaveBeenCalled();
    });

    it('edits reply when interaction already replied', async () => {
      const interaction = makeInteraction({ replied: true });
      await replyEphemeral(interaction, 'Edit message');
      expect(interaction.editReply).toHaveBeenCalledWith({ 
        content: 'Edit message' 
      });
      expect(interaction.reply).not.toHaveBeenCalled();
    });

    it('catches error code 10062 when editReply fails', async () => {
      const interaction = makeInteraction({ deferred: true });
      vi.mocked(interaction.editReply).mockRejectedValue({ code: 10062 });
      await expect(replyEphemeral(interaction, 'msg')).resolves.toBeUndefined();
    });

    it('catches error code 10062 when token expires during editReply', async () => {
      const interaction = makeInteraction({ deferred: true });
      vi.mocked(interaction.editReply).mockRejectedValue({ code: 10062, message: 'Unknown interaction' });
      await expect(replyEphemeral(interaction, 'msg')).resolves.toBeUndefined();
      expect(interaction.editReply).toHaveBeenCalledWith({ content: 'msg' });
    });

    it('catches error code 10062 when reply fails', async () => {
      const interaction = makeInteraction();
      vi.mocked(interaction.reply).mockRejectedValue({ code: 10062 });
      await expect(replyEphemeral(interaction, 'msg')).resolves.toBeUndefined();
    });

    it('catches error code 40060 (already acknowledged)', async () => {
      const interaction = makeInteraction();
      vi.mocked(interaction.reply).mockRejectedValue({ code: 40060 });
      await expect(replyEphemeral(interaction, 'msg')).resolves.toBeUndefined();
    });

    it('rethrows unknown errors from reply', async () => {
      const interaction = makeInteraction();
      vi.mocked(interaction.reply).mockRejectedValue(new Error('Database error'));
      await expect(replyEphemeral(interaction, 'msg')).rejects.toThrow('Database error');
    });

    it('rethrows unknown errors from editReply', async () => {
      const interaction = makeInteraction({ deferred: true });
      const unknownError = new Error('Edit failed');
      vi.mocked(interaction.editReply).mockRejectedValue(unknownError);
      await expect(replyEphemeral(interaction, 'msg')).rejects.toThrow('Edit failed');
    });
  });

  describe('interaction state transitions', () => {
    it('handles transition from fresh to deferred to replied', async () => {
      const interaction = makeInteraction();

      await deferEphemeral(interaction);
      expect(interaction.deferReply).toHaveBeenCalledTimes(1);

      interaction.deferred = true;
      await replyEphemeral(interaction, 'First message');
      expect(interaction.editReply).toHaveBeenCalledWith({ content: 'First message' });

      interaction.replied = true;
      await replyEphemeral(interaction, 'Second message');
      expect(interaction.editReply).toHaveBeenCalledWith({ content: 'Second message' });
      expect(interaction.editReply).toHaveBeenCalledTimes(2);
    });

    it('handles rapid successive replies', async () => {
      const interaction = makeInteraction();

      const promises = [
        replyEphemeral(interaction, 'Message 1'),
        replyEphemeral(interaction, 'Message 2'),
        replyEphemeral(interaction, 'Message 3')
      ];

      await Promise.all(promises);

      expect(vi.mocked(interaction.reply)
        .mock.calls.length + vi.mocked(interaction.editReply).mock.calls.length
      ).toBeGreaterThan(0);
    });
  });
});
