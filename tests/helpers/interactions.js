// Discord interaction factories for command/interaction/permission tests

export const makeInteraction = (overrides = {}) => {
  const { options: customOptions, ...otherOverrides } = overrides;

  return {
    deferred: false,
    replied: false,
    options: {
      getString: jest.fn((key) => customOptions?.[key] ?? null),
      getRole: jest.fn((key) => customOptions?.[key] ?? null),
    },
    deferReply: jest.fn(),
    reply: jest.fn(),
    editReply: jest.fn(),
    member: {
      roles: {
        cache: {
          some: jest.fn((cb) => {
            const roleNames = overrides.roleNames ?? [];
            const mockRoles = roleNames.map(name => ({ name }));
            return mockRoles.some(cb);
          }),
        },
      },
      permissions: {
        has: jest.fn((perm) => overrides.isAdmin ?? false),
      },
    },
    ...otherOverrides,
  };
};

export const makeCommandOptions = ({ course, assignment, date, cohort }) => ({ 
  course, assignment, date, cohort, 
});

export const makeHelperUser = (roleNames = ['Helper']) => makeInteraction({ 
  roleNames 
});

export const makeAdminUser = (roleNames = []) => makeInteraction({ 
  roleNames, 
  isAdmin: true 
});

export const makeRegularUser = () => makeInteraction({ 
  roleNames: ['Student'] 
});
