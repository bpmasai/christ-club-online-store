import { NextRequest, NextResponse } from "next/server";
import { writeEbsSampleFile, getEbsStatus } from "@/lib/storage-service";

/**
 * POST /api/storage/ebs
 * Writes or appends a sample file to the mounted EBS block storage filesystem.
 * Protects against directory traversal and returns the updated file status.
 */
export async function POST(request: NextRequest) {
  try {
    let customNote: string | undefined;
    let filename = "sample-order-file.txt";

    try {
      const body = await request.json();
      if (body.customNote && typeof body.customNote === "string") {
        customNote = body.customNote.slice(0, 200);
      }
      if (body.filename && typeof body.filename === "string") {
        // Enforce safe filename
        filename = body.filename.replace(/[^a-zA-Z0-9._-]/g, "");
      }
    } catch {
      // Body is optional
    }

    const result = writeEbsSampleFile(filename, customNote);
    const updatedStatus = getEbsStatus(filename);

    return NextResponse.json(
      {
        message: "File written successfully to EBS block storage",
        operation: "WRITE_EBS_FILE",
        storageType: "Amazon EBS gp3",
        result: {
          filePath: result.filePath,
          bytesWritten: result.bytesWritten,
          content: result.content,
        },
        status: updatedStatus,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = (error as Error).message || "Error writing to EBS block storage";
    console.error("POST /api/storage/ebs error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
