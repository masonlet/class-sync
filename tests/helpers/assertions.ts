// Shared expectation helpers for common patterns

import { expect, vi } from "vitest";

export const expectIgnoreErrorCode = async (
  fn: () => Promise<unknown>,
  expectedResult: unknown = undefined
): Promise<void> => {
  const promise = fn();
  await expect(promise).resolves.toBe(expectedResult);
};

export const expectSpecificError = (
  fn: () => unknown,
  errorPrefix: string,
  errorMessageMatch: string | RegExp
): void => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    fn();
    expect(consoleErrorSpy).toHaveBeenCalled();
    const call = consoleErrorSpy.mock.calls[0];
    if (!call) throw new Error("console.error was not called");

    const [prefix, error] = call;
    expect(prefix).toBe(`${errorPrefix}:`);
    expect(error.message).toMatch(errorMessageMatch);
  } finally {
    consoleErrorSpy.mockRestore();
  }
};

export const expectEmptyAndLoggedError = (
  loadFn: () => unknown,
  errorPrefix: string,
  expectedDefault: unknown = []
): void => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const result = loadFn();
    expect(result).toEqual(expectedDefault);
    expect(consoleErrorSpy).toHaveBeenCalledWith(`${errorPrefix}:`, expect.any(Error));
  } finally {
    consoleErrorSpy.mockRestore();
  }
};

export const expectRethrowsUnknownError = async (
  fn: () => unknown,
  errorMsg: string | RegExp | Error
): Promise<void> => {
  await expect(fn).rejects.toThrow(errorMsg);
};
