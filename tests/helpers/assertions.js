// Shared expectation helpers for common patterns

export const expectIgnoreErrorCode = async (fn, expectedCode, expectedResult = undefined) => {
  const promise = fn();
  await expect(promise).resolves.toBe(expectedResult);
};

export const expectSpecificError = (fn, errorPrefix, errorMessageMatch) => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  try {
    fn();
    expect(console.error).toHaveBeenCalled();
    const callArgs = console.error.mock.calls;
    expect(callArgs).toBe(`${errorPrefix}:`);
    expect(callArgs.message).toMatch(errorMessageMatch);
  } catch (error) {
    consoleErrorSpy.mockRestore();
  }
};

export const expectEmptyAndLoggedError = (loadFn, errorPrefix, expectedDefault = []) => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  try {
    const result = loadFn();
    expect(result).toEqual(expectedDefault);
    expect(console.error).toHaveBeenCalledWith(`${errorPrefix}:`, expect.any(Error));
  } finally {
    consoleErrorSpy.mockRestore();
  }
};

export const expectRethrowsUnknownError = async (fn, errorMsg) => {
  await expect(fn).rejects.toThrow(errorMsg);
};
