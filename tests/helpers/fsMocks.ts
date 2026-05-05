// Centralized fs mocking for storage tests

import { expect, vi } from "vitest";
import * as fs from "fs";

vi.mock("fs");

export const mockFs = vi.mocked(fs);

export const resetMocks = (): void => {
  mockFs.existsSync.mockReset();
  mockFs.readFileSync.mockReset();
  mockFs.writeFileSync.mockReset();
};

export const mockFileExistsWithJson = (data: unknown): void => {
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockReturnValue(JSON.stringify(data));
};

export const mockFileMissing = (): void => {
  mockFs.existsSync.mockReturnValue(false);
};

export const mockReadError = (errorMsg: string): void => {
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockImplementation(() => { 
    throw new Error(errorMsg); 
  });
};

export const mockParseError = (): void => {
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockReturnValue('invalid json');
};

export const mockWriteError = (errorMsg: string): void => {
  mockFs.writeFileSync.mockImplementation(() => { 
    throw new Error(errorMsg); 
  });
};

export const expectWriteFormatted = (
  expectedFilePath: string,
  expectedData: unknown
): void => {
  expect(mockFs.writeFileSync).toHaveBeenCalledWith(
    expectedFilePath,
    JSON.stringify(expectedData, null, 2)
  );
};
