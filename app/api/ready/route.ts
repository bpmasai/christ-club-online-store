import { NextResponse } from "next/server";
import { checkDatabaseReadiness } from "@/lib/db";
import { getInstanceMetadata } from "@/lib/ec2-metadata";

/**
 * GET /api/ready
 * Readiness check endpoint. Verifies database connectivity (PostgreSQL / RDS).
 * Clearly distinguishes basic web process liveness from complete database readiness.
 */
export async function GET() {
  const [dbStatus, metadata] = await Promise.all([
    checkDatabaseReadiness(),
    getInstanceMetadata(),
  ]);

  const statusCode = dbStatus.ready ? 200 : 503;

  return NextResponse.json(
    {
      status: dbStatus.ready ? "ready" : "not_ready",
      database: {
        connected: dbStatus.ready,
        provider: dbStatus.provider,
        latencyMs: dbStatus.latencyMs,
        message: dbStatus.message,
      },
      instance: {
        instanceId: metadata.instanceId,
        availabilityZone: metadata.availabilityZone,
        hostname: metadata.hostname,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Instance-Id": metadata.instanceId,
      },
    }
  );
}
