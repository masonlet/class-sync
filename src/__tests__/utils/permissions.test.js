const { hasPermission, denyPermission } = require('../../utils/permissions');
const { replyEphemeral } = require('../../utils/interactions');

jest.mock('../../utils/interactions');

const makeInteraction = ({ roleNames = [], isAdmin = false } = {}) => ({
  member: {
    roles: {
      cache: {
        some: (callback) => roleNames.map((name) => ({ name })).some(callback)
      }
    },
    permissions: {
      has: jest.fn((perm) => (perm === 'Administrator' ? isAdmin : false)),
    },
  },
});

describe('permissions', () => {
  const originalEnv = process.env.HELPER_ROLE_NAME;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HELPER_ROLE_NAME = 'Helper';
  });

  afterAll(() => {
    process.env.HELPER_ROLE_NAME = originalEnv;
  });

  describe('hasPermission()', () => {
    it('returns true when user has helper role', () => {
      const interaction = makeInteraction({ 
        roleNames: ['Helper', 'Student'], 
        isAdmin: false 
      });
      const result = hasPermission(interaction);
      expect(result).toBe(true);
    });

    it('does not check admin permission when helper role exists', () => {
      const interaction = makeInteraction({
        roleNames: ['Helper'],
        isAdmin: false
      });

      hasPermission(interaction);
      expect(interaction.member.permissions.has).not.toHaveBeenCalled();
    });

    it('returns true when user has Administrator permission', () => {
      const interaction = makeInteraction({ 
        roleNames: ['Student'], 
        isAdmin: true
      });
      const result = hasPermission(interaction);
      expect(result).toBe(true);
      expect(interaction.member.permissions.has).toHaveBeenCalledWith('Administrator');
    });

    it('returns true when user has both helper role and admin', () => {
      const interaction = makeInteraction({ 
        roleNames: ['Helper'], 
        isAdmin: true 
      });
      const result = hasPermission(interaction);
      expect(result).toBe(true);
    });

    it('returns false when user has neither helper role nor admin', () => {
      const interaction = makeInteraction({ 
        roleNames: ['Student', 'Member'], 
        isAdmin: false 
      });
      const result = hasPermission(interaction);
      expect(result).toBe(false);
    });

    it('returns false when roles cache is empty', () => {
      const interaction = makeInteraction({ 
        roleNames: [], 
        isAdmin: false 
      });
      const result = hasPermission(interaction);
      expect(result).toBe(false);
    });

    it('uses environment variable for role name', () => {
      process.env.HELPER_ROLE_NAME = 'CustomHelper';

      const interaction = makeInteraction({
        roleNames: ['CustomHelper'], 
        isAdmin: false 
      });
      const result = hasPermission(interaction);
      expect(result).toBe(true);
    });

    it('is case-sensitive with role names', () => {
      process.env.HELPER_ROLE_NAME = 'Helper';
      const interaction = makeInteraction({ 
        roleNames: ['helper'],
        isAdmin: false
      });
      const result = hasPermission(interaction);
      expect(result).toBe(false);
    });
  });

  describe('denyPermission()', () => {
    it('calls replyEphemeral with permission denied message', async () => {
      const interaction = makeInteraction({ roleNames: [] });
      await denyPermission(interaction);

      expect(replyEphemeral).toHaveBeenCalledWith(
        interaction,
        'You need the Helper role to use this.'
      );
    });

    it('uses environment variable in message', async () => {
      process.env.HELPER_ROLE_NAME = 'Moderator';
      
      const interaction = makeInteraction({ roleNames: [] });
      await denyPermission(interaction);

      expect(replyEphemeral).toHaveBeenCalledWith(
        interaction,
        'You need the Moderator role to use this.'
      );
    });

    it('returns the result from replyEphemeral', async () => {
      const mockResult = { id: '123', content: 'denied' };
      replyEphemeral.mockResolvedValue(mockResult);
      const interaction = makeInteraction({ roleNames: [] });      
      const result = await denyPermission(interaction);
      expect(result).toBe(mockResult);
    });
  });
});
