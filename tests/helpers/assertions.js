// Shared expectation helpers for common patterns

import { expect, vi } from 'vitest';

export const expectIgnoreErrorCode = async (fn, expectedCode, expectedResult = undefined) => {
  const promise = fn();
  await expect(promise).resolves.toBe(expectedResult);
};

export const expectSpecificError = (fn, errorPrefix, errorMessageMatch) => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    fn();
    expect(consoleErrorSpy).toHaveBeenCalled();
   const [prefix, error] = consoleErrorSpy.mock.calls[0];
    expect(prefix).toBe(`${errorPrefix}:`);
    expect(error.message).toMatch(errorMessageMatch);
  } finally {
    consoleErrorSpy.mockRestore();
  }
};

export const expectEmptyAndLoggedError = (loadFn, errorPrefix, expectedDefault = []) => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const result = loadFn();
    expect(result).toEqual(expectedDefault);
    expect(consoleErrorSpy).toHaveBeenCalledWith(`${errorPrefix}:`, expect.any(Error));
  } finally {
    consoleErrorSpy.mockRestore();
  }
};

export const expectRethrowsUnknownError = async (fn, errorMsg) => {
  await expect(fn).rejects.toThrow(errorMsg);
};
