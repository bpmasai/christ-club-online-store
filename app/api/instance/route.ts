import { NextResponse } from "next/server";
import { getInstanceMetadata } from "@/lib/ec2-metadata";

/**
 * GET /api/instance
 * Returns the hostname, EC2 instance ID (via IMDSv2 or fallback), AZ, and version.
 * Used by load balancer traffic verification scripts to verify multi-instance routing.
 */
export async function GET() {
  const metadata = await getInstanceMetadata();

  return NextResponse.json(
    {
      instanceId: metadata.instanceId,
      availabilityZone: metadata.availabilityZone,
      hostname: metadata.hostname,
      privateIp: metadata.privateIp,
      isAws: metadata.isAws,
      version: metadata.appVersion,
      uptime: metadata.uptime,
      platform: metadata.platform,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Instance-Id": metadata.instanceId,
        "X-Availability-Zone": metadata.availabilityZone,
      },
    }
  );
}
