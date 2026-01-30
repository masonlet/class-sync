// Centralized fs mocking for storage tests

jest.mock('fs');
export const mockFs = jest.requireMock('fs');

export const resetMocks = () => {
  mockFs.existsSync.mockReset();
  mockFs.readFileSync.mockReset();
  mockFs.writeFileSync.mockReset();
};

export const mockFileExistsWithJson = (filePath, data) => {
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockReturnValue(JSON.stringify(data));
};

export const mockFileMissing = () => {
  mockFs.existsSync.mockReturnValue(false);
};

export const mockReadError = (errorMsg) => {
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockImplementation(() => { 
    throw new Error(errorMsg); 
  });
};

export const mockParseError = () => {
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockReturnValue('invalid json');
};

export const mockWriteError = (errorMsg) => {
  mockFs.writeFileSync.mockImplementation(() => { 
    throw new Error(errorMsg); 
  });
};

export const expectWriteFormatted = (expectedFilePath, expectedData) => {
  expect(mockFs.writeFileSync).toHaveBeenCalledWith(
    expectedFilePath,
    JSON.stringify(expectedData, null, 2)
  );
};
