import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getInstanceMetadata } from "../lib/ec2-metadata";

describe("EC2 Metadata & Fallback Tests", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return configured INSTANCE_ID when running in local development mode", async () => {
    process.env.INSTANCE_ID = "test-node-alpha-42";
    process.env.AWS_REGION = "us-east-1";

    const meta = await getInstanceMetadata();
    expect(meta.instanceId).toBe("test-node-alpha-42");
    expect(meta.availabilityZone).toBe("us-east-1a");
    expect(meta.appVersion).toBeDefined();
    expect(meta.privateIp).toBeDefined();
  });

  it("should provide graceful fallback when INSTANCE_ID is not provided", async () => {
    delete process.env.INSTANCE_ID;
    delete process.env.AWS_REGION;

    const meta = await getInstanceMetadata();
    expect(meta.instanceId).toBeDefined();
    expect(meta.availabilityZone).toBe("local-dev-zone");
    expect(meta.isAws).toBe(false);
  });
});
