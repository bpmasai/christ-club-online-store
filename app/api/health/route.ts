import { NextResponse } from "next/server";
import { getInstanceMetadata } from "@/lib/ec2-metadata";

/**
 * GET /api/health
 * Lightweight liveness health check used by AWS Application Load Balancer (ALB) Target Group.
 * Returns HTTP 200 OK immediately if the web process is running.
 */
export async function GET() {
  const metadata = await getInstanceMetadata();

  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "Christ Club Online Store",
      version: metadata.appVersion,
      instanceId: metadata.instanceId,
      availabilityZone: metadata.availabilityZone,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Instance-Id": metadata.instanceId,
      },
    }
  );
}
