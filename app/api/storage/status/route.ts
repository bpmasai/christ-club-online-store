import { NextResponse } from "next/server";
import { getEbsStatus, getS3Status } from "@/lib/storage-service";
import { getInstanceMetadata } from "@/lib/ec2-metadata";

/**
 * GET /api/storage/status
 * Reports diagnostic status of both EBS block storage and S3 object storage.
 * Never exposes AWS access keys, database passwords, or secret environment variables.
 */
export async function GET() {
  try {
    const [ebs, s3, instance] = await Promise.all([
      getEbsStatus(),
      getS3Status(),
      getInstanceMetadata(),
    ]);

    return NextResponse.json({
      instance: {
        instanceId: instance.instanceId,
        availabilityZone: instance.availabilityZone,
        isAws: instance.isAws,
      },
      ebs: {
        storageType: "Amazon EBS gp3 (Block Storage)",
        mountPath: ebs.mountPath,
        isMounted: ebs.isMounted,
        sampleFileExists: ebs.sampleFileExists,
        sampleFileName: ebs.sampleFileName,
        fileSize: ebs.fileSize,
        lastModified: ebs.lastModified,
        previewContent: ebs.previewContent,
        message: ebs.message,
      },
      s3: {
        storageType: "Amazon S3 (Object Storage)",
        bucketName: s3.bucketName,
        region: s3.region,
        isMock: s3.isMock,
        sampleFileExists: s3.sampleFileExists,
        sampleFileName: s3.sampleFileName,
        fileSize: s3.fileSize,
        lastModified: s3.lastModified,
        etag: s3.etag,
        previewContent: s3.previewContent,
        message: s3.message,
      },
      comparison: {
        ebsScope: "Single-AZ & Single-Instance (Attached directly as a raw block block volume)",
        s3Scope: "Multi-AZ Regional & Internet/IAM accessible (Object storage accessed via API)",
      },
    });
  } catch (error) {
    console.error("GET /api/storage/status error:", error);
    return NextResponse.json(
      { error: "Error checking storage status" },
      { status: 500 }
    );
  }
}
