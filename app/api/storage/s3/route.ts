import { NextRequest, NextResponse } from "next/server";
import { uploadS3SampleFile, getS3Status } from "@/lib/storage-service";

/**
 * POST /api/storage/s3
 * Uploads a sample order file to the Amazon S3 private bucket.
 * Uses AWS SDK v3 with EC2 IAM Role authentication (or local mock for laptop testing).
 */
export async function POST(request: NextRequest) {
  try {
    let customNote: string | undefined;
    let filename = "sample-s3-file.txt";

    try {
      const body = await request.json();
      if (body.customNote && typeof body.customNote === "string") {
        customNote = body.customNote.slice(0, 200);
      }
      if (body.filename && typeof body.filename === "string") {
        filename = body.filename.replace(/[^a-zA-Z0-9._-]/g, "");
      }
    } catch {
      // Body is optional
    }

    const result = await uploadS3SampleFile(filename, customNote);
    const updatedStatus = await getS3Status(filename);

    return NextResponse.json(
      {
        message: result.isMock
          ? "File successfully stored in simulated S3 storage (local mode)"
          : "File successfully uploaded to Amazon S3 bucket via AWS SDK v3",
        operation: "PUT_S3_OBJECT",
        storageType: "Amazon S3 (Standard Object Storage)",
        result: {
          bucket: result.bucket,
          key: result.key,
          etag: result.etag,
          isMock: result.isMock,
          content: result.content,
        },
        status: updatedStatus,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = (error as Error).message || "Error uploading to Amazon S3";
    console.error("POST /api/storage/s3 error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
