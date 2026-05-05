// Global setup: Runs before all tests

import { vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.clearAllMocks();
});
