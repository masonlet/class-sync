// Discord interaction factories for command/interaction/permission tests

import { vi } from "vitest";
import type { ChatInputCommandInteraction, Role, APIRole } from "discord.js";

type InteractionOverrides = {
  options?: Record<string, unknown>;
  roleNames?: string[];
  isAdmin?: boolean;
}

export const makeInteraction = (
  overrides: InteractionOverrides = {}
): ChatInputCommandInteraction => {
  const { options: customOptions, ...otherOverrides } = overrides;

  return {
    deferred: false,
    replied: false,
    options: {
      getString: vi.fn((key: string) => customOptions?.[key] ?? null),
      getRole: vi.fn((key: string) => customOptions?.[key] ?? null),
    },
    deferReply: vi.fn(),
    reply: vi.fn(),
    editReply: vi.fn(),
    member: {
      roles: {
        cache: {
          some: vi.fn((cb: (role: { name: string }) => boolean) => {
            const roleNames = overrides.roleNames ?? [];
            const mockRoles = roleNames.map(name => ({ name }));
            return mockRoles.some(cb);
          }),
        },
      },
      permissions: {
        has: vi.fn(() => overrides.isAdmin ?? false),
      },
    },
    ...otherOverrides,
  } as unknown as ChatInputCommandInteraction;
};

type CommandOptionInputs = {
  course?: string | null | undefined;
  assignment?: string | null | undefined;
  date?: string | null | undefined;
  cohort?: Role | APIRole | { id: string; name: string } | null | undefined;
};

export const makeCommandOptions = ({
  course, assignment, date, cohort,
}: CommandOptionInputs): CommandOptionInputs => ({
  course, assignment, date, cohort,
});

export const makeHelperUser = (
  roleNames: string[] = ["Helper"]
): ChatInputCommandInteraction => makeInteraction({ roleNames });

export const makeAdminUser = (
  roleNames: string[] = []
): ChatInputCommandInteraction => makeInteraction({ roleNames, isAdmin: true });

export const makeRegularUser = (): ChatInputCommandInteraction =>
  makeInteraction({roleNames: ["Student"] });
