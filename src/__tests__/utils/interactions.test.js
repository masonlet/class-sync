const { deferEphemeral, replyEphemeral } = require('../../utils/interactions');
const { MessageFlags } = require('discord.js');

const makeInteraction = ({ deferred = false, replied = false } = {}) => ({
  deferred,
  replied,
  deferReply: jest.fn(),
  reply: jest.fn(),
  editReply: jest.fn()
});

describe('interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      interaction.deferReply.mockRejectedValue({ code: 10062 });

      await expect(deferEphemeral(interaction)).resolves.toBeUndefined();
    });

    it('catches error code 40060 (already acknowledged)', async () => {
      const interaction = makeInteraction();
      interaction.deferReply.mockRejectedValue({ code: 40060 });

      await expect(deferEphemeral(interaction)).resolves.toBeUndefined();
    });

    it('rethrows unknown errors', async () => {
      const interaction = makeInteraction();
      const unknownError = new Error('Network failure');
      interaction.deferReply.mockRejectedValue(unknownError);

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
      interaction.editReply.mockRejectedValue({ code: 10062 });

      await expect(replyEphemeral(interaction, 'msg')).resolves.toBeUndefined();
    });

    it('catches error code 10062 when token expires during editReply', async () => {
      const interaction = makeInteraction({ deferred: true });
      interaction.editReply.mockRejectedValue({ code: 10062, message: 'Unknown interaction' });

      await expect(replyEphemeral(interaction, 'msg')).resolves.toBeUndefined();
      expect(interaction.editReply).toHaveBeenCalledWith({ content: 'msg' });
    });

    it('catches error code 10062 when reply fails', async () => {
      const interaction = makeInteraction();
      interaction.reply.mockRejectedValue({ code: 10062 });

      await expect(replyEphemeral(interaction, 'msg')).resolves.toBeUndefined();
    });

    it('catches error code 40060 (already acknowledged)', async () => {
      const interaction = makeInteraction();
      interaction.reply.mockRejectedValue({ code: 40060 });

      await expect(replyEphemeral(interaction, 'msg')).resolves.toBeUndefined();
    });

    it('rethrows unknown errors from reply', async () => {
      const interaction = makeInteraction();
      const unknownError = new Error('Database error');
      interaction.reply.mockRejectedValue(unknownError);

      await expect(replyEphemeral(interaction, 'msg')).rejects.toThrow('Database error');
    });

    it('rethrows unknown errors from editReply', async () => {
      const interaction = makeInteraction({ deferred: true });
      const unknownError = new Error('Edit failed');
      interaction.editReply.mockRejectedValue(unknownError);

      await expect(replyEphemeral(interaction, 'msg')).rejects.toThrow('Edit failed');
    });

    it('returns result from reply', async () => {
      const interaction = makeInteraction();
      const mockResult = { id: '123' };
      interaction.reply.mockResolvedValue(mockResult);

      const result = await replyEphemeral(interaction, 'msg');
      expect(result).toBe(mockResult);
    });

    it('returns result from editReply', async () => {
      const interaction = makeInteraction({ deferred: true });
      const mockResult = { id: '456' };
      interaction.editReply.mockResolvedValue(mockResult);

      const result = await replyEphemeral(interaction, 'msg');
      expect(result).toBe(mockResult);
    });
  });
});
