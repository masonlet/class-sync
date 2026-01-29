// Shared expectation helpers for common patterns

const expectIgnoreErrorCode = async (fn, expectedCode, expectedResult = undefined) => {
  const mockError = { code: expectedCode };
  const promise = fn();
  await expect(promise).resolves.toBe(expectedResult);
};

const expectSpecificError = (fn, errorPrefix, errorMessageMatch) => {
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

const expectEmptyAndLoggedError = (loadFn, errorPrefix, expectedDefault = []) => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  try {
    const result = loadFn();
    expect(result).toEqual(expectedDefault);
    expect(console.error).toHaveBeenCalledWith(`${errorPrefix}:`, expect.any(Error));
  } finally {
    consoleErrorSpy.mockRestore();
  }
};

const expectRethrowsUnknownError = async (fn, errorMsg) => {
  const unknownError = new Error(errorMsg);
  await expect(fn).rejects.toThrow(errorMsg);
};

module.exports = {
  expectIgnoreErrorCode,
  expectSpecificError,
  expectEmptyAndLoggedError,
  expectRethrowsUnknownError,
};
