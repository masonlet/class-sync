import { describe, it, expect, vi, beforeEach, afterAll, type Mock } from 'vitest';
import { makeHelperUser, makeAdminUser, makeRegularUser } from '../helpers/interactions.js';
import { hasPermission, denyPermission                  } from '../../src/utils/permissions.js';
import { replyEphemeral                                 } from '../../src/utils/interactions.js';

vi.mock('../../src/utils/interactions');

type MockMember = {
  roles: { cache: { some: Mock } | null };
  permissions: { has: Mock };
};

describe('permissions', () => {
  const originalEnv = process.env['HELPER_ROLE_NAME'];

  beforeEach(() => {
    process.env['HELPER_ROLE_NAME'] = 'Helper';
  });

  afterAll(() => {
    process.env['HELPER_ROLE_NAME'] = originalEnv;
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
      const member = interaction.member as unknown as MockMember;
      expect(member.permissions.has).not.toHaveBeenCalled();
    });

    it('returns true when user has Administrator permission', () => {
      const interaction = makeAdminUser(['Student']);
      const result = hasPermission(interaction);
      expect(result).toBe(true);
      const member = interaction.member as unknown as MockMember;
      expect(member.permissions.has).toHaveBeenCalledWith('Administrator');
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
      (interaction.member as unknown as MockMember).roles.cache!.some = vi.fn(() => false);
      const result = hasPermission(interaction);
      expect(result).toBe(false);
    });

    it('uses environment variable for role name', () => {
      process.env['HELPER_ROLE_NAME'] = 'CustomHelper';
      const interaction = makeHelperUser(['CustomHelper']);
      const result = hasPermission(interaction);
      expect(result).toBe(true);
    });

    it('is case-sensitive with role names', () => {
      process.env['HELPER_ROLE_NAME'] = 'Helper';
      const interaction = makeHelperUser(['helper']);
      const result = hasPermission(interaction);
      expect(result).toBe(false);
    });

    describe('edge cases', () => {
      it('falls back to Helper role when env is unset', () => {
        const original = process.env['HELPER_ROLE_NAME'];
        delete process.env['HELPER_ROLE_NAME'];
        const interaction = makeHelperUser();
        const result = hasPermission(interaction);
        expect(result).toBe(true);
        process.env['HELPER_ROLE_NAME'] = original;
      });

      it('uses Helper fallback in message when env is unset', async () => {
        delete process.env['HELPER_ROLE_NAME'];
        const interaction = makeRegularUser();
        await denyPermission(interaction);
        expect(replyEphemeral).toHaveBeenCalledWith(
          interaction,
          'You need the Helper role to use this.'
        );
      });

      it('handles whitespace in role names', () => {
        process.env['HELPER_ROLE_NAME'] = 'Helper';
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
      process.env['HELPER_ROLE_NAME'] = 'Moderator';
      const interaction = makeRegularUser();
      await denyPermission(interaction);
      expect(replyEphemeral).toHaveBeenCalledWith(
        interaction,
        'You need the Moderator role to use this.'
      );
    });
  });
});
