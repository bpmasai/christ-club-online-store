import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  writeEbsSampleFile,
  getEbsStatus,
  getEbsMountPath,
} from "../lib/storage-service";

describe("Storage Security & Operation Tests", () => {
  const testMount = path.resolve("./data/test-ebs-mount");

  beforeEach(() => {
    process.env.EBS_MOUNT_PATH = testMount;
    if (!fs.existsSync(testMount)) {
      fs.mkdirSync(testMount, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testMount)) {
      fs.rmSync(testMount, { recursive: true, force: true });
    }
    delete process.env.EBS_MOUNT_PATH;
  });

  it("should write and read sample file to configured mount location", () => {
    const filename = "sample-order-file.txt";
    const result = writeEbsSampleFile(filename, "Vitest automated assertion note");

    expect(result.success).toBe(true);
    expect(fs.existsSync(result.filePath)).toBe(true);
    expect(result.bytesWritten).toBeGreaterThan(0);
    expect(result.content).toContain("CHRIST CLUB ONLINE STORE");

    const status = getEbsStatus(filename);
    expect(status.isMounted).toBe(true);
    expect(status.sampleFileExists).toBe(true);
    expect(status.sampleFileName).toBe(filename);
  });

  it("should sanitize path traversal attempts in filename", () => {
    // Attempt directory traversal
    const maliciousFilename = "../../../etc/passwd";
    const result = writeEbsSampleFile(maliciousFilename, "Path traversal attack payload");

    // The handler must strip path traversal characters to the basename
    expect(result.filePath.startsWith(path.resolve(testMount))).toBe(true);
    expect(path.basename(result.filePath)).toBe("passwd");
  });
});
