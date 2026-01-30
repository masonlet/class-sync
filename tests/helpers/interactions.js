// Discord interaction factories for command/interaction/permission tests

import { vi } from 'vitest';

export const makeInteraction = (overrides = {}) => {
  const { options: customOptions, ...otherOverrides } = overrides;

  return {
    deferred: false,
    replied: false,
    options: {
      getString: vi.fn((key) => customOptions?.[key] ?? null),
      getRole: vi.fn((key) => customOptions?.[key] ?? null),
    },
    deferReply: vi.fn(),
    reply: vi.fn(),
    editReply: vi.fn(),
    member: {
      roles: {
        cache: {
          some: vi.fn((cb) => {
            const roleNames = overrides.roleNames ?? [];
            const mockRoles = roleNames.map(name => ({ name }));
            return mockRoles.some(cb);
          }),
        },
      },
      permissions: {
        has: vi.fn((perm) => overrides.isAdmin ?? false),
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
