// Centralized fs mocking for storage tests
const fs = require('fs');

jest.mock('fs');

const mockFs = jest.requireMock('fs');

const resetMocks = () => {
  mockFs.existsSync.mockReset();
  mockFs.readFileSync.mockReset();
  mockFs.writeFileSync.mockReset();
};

const mockFileExistsWithJson = (filePath, data) => {
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockReturnValue(JSON.stringify(data));
};

const mockFileMissing = () => {
  mockFs.existsSync.mockReturnValue(false);
};

const mockReadError = (errorMsg) => {
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockImplementation(() => { 
    throw new Error(errorMsg); 
  });
};

const mockParseError = () => {
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockReturnValue('invalid json');
};

const mockWriteError = (errorMsg) => {
  mockFs.writeFileSync.mockImplementation(() => { 
    throw new Error(errorMsg); 
  });
};

const expectWriteFormatted = (expectedFilePath, expectedData) => {
  expect(mockFs.writeFileSync).toHaveBeenCalledWith(
    expectedFilePath,
    JSON.stringify(expectedData, null, 2)
  );
};

module.exports = {
  mockFs,
  resetMocks,
  mockFileExistsWithJson,
  mockFileMissing,
  mockReadError,
  mockParseError,
  mockWriteError,
  expectWriteFormatted,
}
