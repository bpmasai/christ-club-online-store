import os from "os";
import { InstanceMetadata } from "./types";

/**
 * Retrieves EC2 instance metadata using AWS IMDSv2 (Instance Metadata Service Version 2).
 * Falls back gracefully to local host details when running outside AWS EC2.
 */
export async function getInstanceMetadata(): Promise<InstanceMetadata> {
  const defaultHostname = os.hostname();
  const envInstanceId = process.env.INSTANCE_ID;
  const appVersion = process.env.APP_VERSION || "1.0.0";
  const uptime = Math.floor(process.uptime());

  // Default fallback for local laptop development
  const metadata: InstanceMetadata = {
    instanceId: envInstanceId || `local-${defaultHostname.slice(0, 12)}`,
    availabilityZone: process.env.AWS_REGION ? `${process.env.AWS_REGION}a` : "local-dev-zone",
    privateIp: getLocalIpAddress(),
    hostname: defaultHostname,
    isAws: false,
    appVersion,
    uptime,
    platform: `${os.platform()} (${os.arch()})`,
    nodeVersion: process.version,
  };

  // Attempt IMDSv2 only on Linux or when not explicitly mocked
  if (process.env.NODE_ENV === "test" && !process.env.FORCE_AWS_TEST) {
    return metadata;
  }

  try {
    // IMDSv2 Step 1: Request session token with 1-second timeout
    const tokenController = new AbortController();
    const tokenTimeout = setTimeout(() => tokenController.abort(), 1000);

    const tokenResponse = await fetch("http://169.254.169.254/latest/api/token", {
      method: "PUT",
      headers: {
        "X-aws-ec2-metadata-token-ttl-seconds": "60",
      },
      signal: tokenController.signal,
    });
    clearTimeout(tokenTimeout);

    if (!tokenResponse.ok) {
      return metadata;
    }

    const token = await tokenResponse.text();

    // IMDSv2 Step 2: Fetch instance ID, AZ, and private IP using the token
    const fetchMetadataItem = async (path: string): Promise<string> => {
      const itemController = new AbortController();
      const itemTimeout = setTimeout(() => itemController.abort(), 1000);
      try {
        const res = await fetch(`http://169.254.169.254/latest/meta-data/${path}`, {
          headers: {
            "X-aws-ec2-metadata-token": token,
          },
          signal: itemController.signal,
        });
        clearTimeout(itemTimeout);
        if (res.ok) return (await res.text()).trim();
      } catch {
        clearTimeout(itemTimeout);
      }
      return "";
    };

    const [instanceId, az, localIp] = await Promise.all([
      fetchMetadataItem("instance-id"),
      fetchMetadataItem("placement/availability-zone"),
      fetchMetadataItem("local-ipv4"),
    ]);

    if (instanceId) {
      metadata.instanceId = instanceId;
      metadata.isAws = true;
    }
    if (az) {
      metadata.availabilityZone = az;
    }
    if (localIp) {
      metadata.privateIp = localIp;
    }
  } catch {
    // Running on laptop or IMDSv2 timed out - fallback already set
  }

  return metadata;
}

function getLocalIpAddress(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (!iface.internal && iface.family === "IPv4") {
          return iface.address;
        }
      }
    }
  } catch {
    // Ignore network interface enumeration errors
  }
  return "127.0.0.1";
}
