import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

// -----------------------------------------------------------------------------
// 1. AMAZON EBS (BLOCK STORAGE) HANDLER
// -----------------------------------------------------------------------------
const DEFAULT_EBS_PATH = process.platform === "win32" ? "./data/ebs-mount" : "/mnt/demo-ebs";

export function getEbsMountPath(): string {
  const customPath = process.env.EBS_MOUNT_PATH;
  if (customPath) {
    return path.resolve(customPath);
  }
  return path.resolve(DEFAULT_EBS_PATH);
}

/**
 * Validates that the requested target filename is strictly contained within
 * the allowed EBS mount directory to prevent directory traversal attacks (CWE-22).
 */
function resolveSafeEbsPath(filename: string): string {
  const basePath = getEbsMountPath();
  // Strip any leading slashes or backslashes
  const cleanFilename = path.basename(filename);
  const resolved = path.resolve(basePath, cleanFilename);

  if (!resolved.startsWith(basePath)) {
    throw new Error("Security Error: Path traversal attempt detected.");
  }
  return resolved;
}

export interface EbsStatus {
  mountPath: string;
  isMounted: boolean;
  sampleFileExists: boolean;
  sampleFileName: string;
  fileSize?: number;
  lastModified?: string;
  previewContent?: string;
  message: string;
}

export function getEbsStatus(sampleFileName = "sample-order-file.txt"): EbsStatus {
  const mountPath = getEbsMountPath();
  const exists = fs.existsSync(mountPath);

  if (!exists) {
    return {
      mountPath,
      isMounted: false,
      sampleFileExists: false,
      sampleFileName,
      message: `Mount directory '${mountPath}' is not accessible. (On EC2, verify volume is mounted to /mnt/demo-ebs).`,
    };
  }

  const filePath = resolveSafeEbsPath(sampleFileName);
  const fileExists = fs.existsSync(filePath);

  let fileSize: number | undefined;
  let lastModified: string | undefined;
  let previewContent: string | undefined;

  if (fileExists) {
    try {
      const stat = fs.statSync(filePath);
      fileSize = stat.size;
      lastModified = stat.mtime.toISOString();
      const content = fs.readFileSync(filePath, "utf-8");
      previewContent = content.length > 500 ? content.slice(0, 500) + "..." : content;
    } catch {
      // Ignore read errors
    }
  }

  return {
    mountPath,
    isMounted: true,
    sampleFileExists: fileExists,
    sampleFileName,
    fileSize,
    lastModified,
    previewContent,
    message: fileExists
      ? `EBS Block Storage is active. File '${sampleFileName}' (${fileSize} bytes) verified on mounted volume.`
      : `EBS mount directory exists at '${mountPath}', but sample file has not been created yet.`,
  };
}

export function writeEbsSampleFile(
  filename = "sample-order-file.txt",
  customNote?: string
): { success: boolean; filePath: string; bytesWritten: number; content: string } {
  const mountPath = getEbsMountPath();
  if (!fs.existsSync(mountPath)) {
    fs.mkdirSync(mountPath, { recursive: true });
  }

  const safePath = resolveSafeEbsPath(filename);
  const timestamp = new Date().toISOString();
  const host = process.env.INSTANCE_ID || "Local-Instance";

  const content = [
    "============================================================",
    "CHRIST CLUB ONLINE STORE - AMAZON EBS BLOCK STORAGE DEMO",
    "============================================================",
    `Timestamp:      ${timestamp}`,
    `Writing Node:   ${host}`,
    `Filesystem:     POSIX ext4 on Amazon EBS gp3 (SSD)`,
    `Mount Location: ${mountPath}`,
    "------------------------------------------------------------",
    "DEMONSTRATION PURPOSE:",
    "This file proves Amazon EBS block-level persistent storage.",
    "Unlike ephemeral instance stores, data on this gp3 volume",
    "persists through instance stops, starts, and reboots.",
    "------------------------------------------------------------",
    `Operator Note:  ${customNote || "Automated verification test payload."}`,
    "============================================================",
  ].join("\n");

  fs.writeFileSync(safePath, content, "utf-8");
  const stat = fs.statSync(safePath);

  return {
    success: true,
    filePath: safePath,
    bytesWritten: stat.size,
    content,
  };
}

// -----------------------------------------------------------------------------
// 2. AMAZON S3 (OBJECT STORAGE) HANDLER
// -----------------------------------------------------------------------------
export interface S3Status {
  bucketName: string;
  region: string;
  isMock: boolean;
  sampleFileExists: boolean;
  sampleFileName: string;
  fileSize?: number;
  lastModified?: string;
  previewContent?: string;
  etag?: string;
  message: string;
}

function createS3Client(): S3Client {
  const region = process.env.AWS_REGION || "us-east-1";
  // In AWS EC2, AWS SDK automatically authenticates using the IAM Instance Profile.
  return new S3Client({ region });
}

export async function getS3Status(sampleFileName = "sample-s3-file.txt"): Promise<S3Status> {
  const bucketName = process.env.S3_BUCKET_NAME || "christ-club-store-storage-demo";
  const region = process.env.AWS_REGION || "us-east-1";
  const isMock = process.env.MOCK_S3_LOCAL === "true" || !process.env.AWS_REGION;

  // Local Mock Mode for Laptop Testing
  if (isMock) {
    const mockDir = path.resolve("./data/s3-mock");
    if (!fs.existsSync(mockDir)) {
      fs.mkdirSync(mockDir, { recursive: true });
    }
    const safePath = path.resolve(mockDir, path.basename(sampleFileName));
    const exists = fs.existsSync(safePath);

    let fileSize: number | undefined;
    let lastModified: string | undefined;
    let previewContent: string | undefined;

    if (exists) {
      const stat = fs.statSync(safePath);
      fileSize = stat.size;
      lastModified = stat.mtime.toISOString();
      previewContent = fs.readFileSync(safePath, "utf-8");
    }

    return {
      bucketName,
      region,
      isMock: true,
      sampleFileExists: exists,
      sampleFileName,
      fileSize,
      lastModified,
      previewContent,
      etag: exists ? '"mock-etag-7a8b9c0d"' : undefined,
      message: exists
        ? `Local simulated S3 bucket has '${sampleFileName}' (${fileSize} bytes). (In AWS, this writes to s3://${bucketName} via IAM Role).`
        : `Simulated S3 storage ready. Sample file '${sampleFileName}' not yet uploaded.`,
    };
  }

  // Real AWS S3 Client via IAM Role
  try {
    const s3 = createS3Client();
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: sampleFileName,
    });
    const response = await s3.send(command);
    const bodyString = await response.Body?.transformToString();

    return {
      bucketName,
      region,
      isMock: false,
      sampleFileExists: true,
      sampleFileName,
      fileSize: response.ContentLength,
      lastModified: response.LastModified?.toISOString(),
      etag: response.ETag,
      previewContent: bodyString ? (bodyString.length > 500 ? bodyString.slice(0, 500) + "..." : bodyString) : undefined,
      message: `Object 's3://${bucketName}/${sampleFileName}' verified via Amazon S3 API.`,
    };
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };
    const notFound = error.name === "NoSuchKey" || error.name === "NotFound";

    return {
      bucketName,
      region,
      isMock: false,
      sampleFileExists: false,
      sampleFileName,
      message: notFound
        ? `Connected to S3 bucket '${bucketName}'. Sample file '${sampleFileName}' has not been uploaded yet.`
        : `S3 access note: ${error.message || "Unable to reach S3 bucket. Ensure EC2 IAM Role has s3:GetObject permission."}`,
    };
  }
}

export async function uploadS3SampleFile(
  filename = "sample-s3-file.txt",
  customNote?: string
): Promise<{ success: boolean; bucket: string; key: string; etag?: string; isMock: boolean; content: string }> {
  const bucketName = process.env.S3_BUCKET_NAME || "christ-club-store-storage-demo";
  const region = process.env.AWS_REGION || "us-east-1";
  const isMock = process.env.MOCK_S3_LOCAL === "true" || !process.env.AWS_REGION;
  const timestamp = new Date().toISOString();
  const host = process.env.INSTANCE_ID || "Local-Instance";

  const content = [
    "============================================================",
    "CHRIST CLUB ONLINE STORE - AMAZON S3 OBJECT STORAGE DEMO",
    "============================================================",
    `Timestamp:      ${timestamp}`,
    `Source Node:    ${host}`,
    `Storage Class:  Amazon S3 Standard`,
    `Target Bucket:  s3://${bucketName}/`,
    `Object Key:     ${filename}`,
    "------------------------------------------------------------",
    "DEMONSTRATION PURPOSE:",
    "This file proves Amazon S3 scalable, highly-available object",
    "storage. Unlike EBS (which is locked to an AZ and single EC2),",
    "this S3 object can be accessed from any EC2 instance in any AZ",
    "using IAM Role least-privilege credentials.",
    "------------------------------------------------------------",
    `Payload Note:   ${customNote || "Order export catalog demonstration file."}`,
    "============================================================",
  ].join("\n");

  if (isMock) {
    const mockDir = path.resolve("./data/s3-mock");
    if (!fs.existsSync(mockDir)) {
      fs.mkdirSync(mockDir, { recursive: true });
    }
    const safePath = path.resolve(mockDir, path.basename(filename));
    fs.writeFileSync(safePath, content, "utf-8");

    return {
      success: true,
      bucket: bucketName,
      key: filename,
      etag: '"mock-etag-abc12345"',
      isMock: true,
      content,
    };
  }

  const s3 = createS3Client();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filename,
    Body: Buffer.from(content, "utf-8"),
    ContentType: "text/plain",
    Metadata: {
      "uploaded-by": host,
      "project": "ChristClubOnlineStore",
    },
  });

  const response = await s3.send(command);

  return {
    success: true,
    bucket: bucketName,
    key: filename,
    etag: response.ETag,
    isMock: false,
    content,
  };
}
