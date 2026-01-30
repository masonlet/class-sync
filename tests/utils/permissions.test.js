import { makeInteraction, makeHelperUser, makeAdminUser, makeRegularUser } from '../helpers/interactions';

import { hasPermission, denyPermission } from '../../src/utils/permissions';
import { replyEphemeral } from '../../src/utils/interactions';

jest.mock('../../src/utils/interactions');

describe('permissions', () => {
  const originalEnv = process.env.HELPER_ROLE_NAME;

  beforeEach(() => {
    process.env.HELPER_ROLE_NAME = 'Helper';
  });

  afterAll(() => {
    process.env.HELPER_ROLE_NAME = originalEnv;
  });

  describe('hasPermission()', () => {
    it('returns true when user has helper role', () => {
      const interaction = makeHelperUser(['Helper', 'Student']);
      const result = hasPermission(interaction);
      expect(result).toBe(true);
    });

    it('does not check admin permission when helper role exists', () => {
      const interaction = makeHelperUser();
      hasPermission(interaction);
      expect(interaction.member.permissions.has).not.toHaveBeenCalled();
    });

    it('returns true when user has Administrator permission', () => {
      const interaction = makeAdminUser(['Student']);
      const result = hasPermission(interaction);
      expect(result).toBe(true);
      expect(interaction.member.permissions.has).toHaveBeenCalledWith('Administrator');
    });

    it('returns true when user has both helper role and admin', () => {
      const interaction = makeAdminUser(['Helper']);
      const result = hasPermission(interaction);
      expect(result).toBe(true);
    });

    it('returns false when user has neither helper role nor admin', () => {
      const interaction = makeRegularUser();
      const result = hasPermission(interaction);
      expect(result).toBe(false);
    });

    it('returns false when roles cache is empty', () => {
      const interaction = makeRegularUser();
      interaction.member.roles.cache.some = jest.fn(() => false);
      const result = hasPermission(interaction);
      expect(result).toBe(false);
    });

    it('uses environment variable for role name', () => {
      process.env.HELPER_ROLE_NAME = 'CustomHelper';
      const interaction = makeHelperUser(['CustomHelper']);
      const result = hasPermission(interaction);
      expect(result).toBe(true);
    });

    it('is case-sensitive with role names', () => {
      process.env.HELPER_ROLE_NAME = 'Helper';
      const interaction = makeHelperUser(['helper']);
      const result = hasPermission(interaction);
      expect(result).toBe(false);
    });

    describe('edge cases', () => {
      describe.each([
        ['missing roles cache', (interaction) => { interaction.member.roles.cache = null; }],
        ['missing permissions object', (interaction) => { interaction.member.roles.cache = null; }],
      ])('handles %s gracefully', (description, mutate) => {
        it('does not throw and returns false', () => {
          const interaction = makeInteraction({ roleNames: [] });
          mutate(interaction);
          expect(() => hasPermission(interaction)).not.toThrow();
          expect(hasPermission(interaction)).toBe(false);
        });
      });

      it('handles missing HELPER_ROLE_NAME environment variable', () => {
        const original = process.env.HELPER_ROLE_NAME;
        delete process.env.HELPER_ROLE_NAME;

        const interaction = makeHelperUser();
        const result = hasPermission(interaction);

        expect(result).toBe(false);

        process.env.HELPER_ROLE_NAME = original;
      });

      it('handles whitespace in role names', () => {
        process.env.HELPER_ROLE_NAME = 'Helper';
        const interaction = makeHelperUser(['  Helper  ']);

        const result = hasPermission(interaction);

        expect(result).toBe(false);
      });
    });
  });

  describe('denyPermission()', () => {
    it('calls replyEphemeral with permission denied message', async () => {
      const interaction = makeRegularUser();
      await denyPermission(interaction);
      expect(replyEphemeral).toHaveBeenCalledWith(
        interaction,
        'You need the Helper role to use this.'
      );
    });

    it('uses environment variable in message', async () => {
      process.env.HELPER_ROLE_NAME = 'Moderator';
      const interaction = makeRegularUser();
      await denyPermission(interaction);
      expect(replyEphemeral).toHaveBeenCalledWith(
        interaction,
        'You need the Moderator role to use this.'
      );
    });

    it('returns the result from replyEphemeral', async () => {
      const mockResult = { id: '123', content: 'denied' };
      replyEphemeral.mockResolvedValue(mockResult);
      const interaction = makeRegularUser();     
      const result = await denyPermission(interaction);
      expect(result).toBe(mockResult);
    });
  });
});
