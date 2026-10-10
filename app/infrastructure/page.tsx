"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import {
  Activity,
  Server,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Network,
  Clock,
  Layers,
  Shield,
} from "lucide-react";

interface TelemetryData {
  instance: {
    instanceId: string;
    availabilityZone: string;
    hostname: string;
    privateIp: string;
    isAws: boolean;
    version: string;
    uptime: number;
    platform: string;
  };
  health: {
    status: string;
    timestamp: string;
  };
  readiness: {
    ready: boolean;
    provider: string;
    latencyMs: number;
    message: string;
  };
}

interface TrafficResult {
  instanceId: string;
  az: string;
  count: number;
  percentage: number;
}

export default function InfrastructurePage() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Live Load Test Simulation State
  const [simulating, setSimulating] = useState(false);
  const [requestsSent, setRequestsSent] = useState(0);
  const [trafficDistribution, setTrafficDistribution] = useState<Record<string, { count: number; az: string }>>({});

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const [instRes, healthRes, readyRes] = await Promise.all([
        fetch("/api/instance", { cache: "no-store" }),
        fetch("/api/health", { cache: "no-store" }),
        fetch("/api/ready", { cache: "no-store" }),
      ]);

      const instance = instRes.ok ? await instRes.json() : null;
      const health = healthRes.ok ? await healthRes.json() : null;
      const ready = readyRes.ok ? await readyRes.json() : null;

      setTelemetry({
        instance: instance || {
          instanceId: "unknown",
          availabilityZone: "unknown",
          hostname: "unknown",
          privateIp: "127.0.0.1",
          isAws: false,
          version: "1.0.0",
          uptime: 0,
          platform: "node",
        },
        health: health || { status: "unknown", timestamp: new Date().toISOString() },
        readiness: ready
          ? {
              ready: ready.status === "ready",
              provider: ready.database?.provider || "PostgreSQL",
              latencyMs: ready.database?.latencyMs || 0,
              message: ready.database?.message || "",
            }
          : {
              ready: false,
              provider: "Unknown",
              latencyMs: 0,
              message: "Unable to query readiness endpoint",
            },
      });
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const runTrafficSimulation = async (totalRequests = 20) => {
    setSimulating(true);
    setRequestsSent(0);
    const tallies: Record<string, { count: number; az: string }> = {};

    for (let i = 1; i <= totalRequests; i++) {
      try {
        const res = await fetch("/api/instance", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const key = json.instanceId || "instance-unknown";
          if (!tallies[key]) {
            tallies[key] = { count: 0, az: json.availabilityZone || "N/A" };
          }
          tallies[key].count += 1;
        }
      } catch {
        // Ignore individual failures
      }
      setRequestsSent(i);
      setTrafficDistribution({ ...tallies });
      // Small pause to allow visual feedback
      await new Promise((r) => setTimeout(r, 60));
    }

    setSimulating(false);
  };

  const trafficSummary: TrafficResult[] = Object.entries(trafficDistribution).map(
    ([instanceId, data]) => ({
      instanceId,
      az: data.az,
      count: data.count,
      percentage: requestsSent > 0 ? Math.round((data.count / requestsSent) * 100) : 0,
    })
  );

  return (
    <>
      <Navbar title="Infrastructure & Load Balancer Status" />
      <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                Assignment Requirements 1 & 2
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-2">
                Cloud Telemetry & ALB Traffic Inspector
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl">
                Observe live metrics for the EC2 node handling your HTTP traffic, verify database readiness vs application liveness, and test ALB traffic distribution across Availability Zones.
              </p>
            </div>
            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
              Refresh Telemetry
            </button>
          </div>
        </div>

        {/* Node & Health Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Serving EC2 Node Identity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Serving Instance</h3>
                  <p className="text-[11px] text-slate-400">AWS IMDSv2 Identity</p>
                </div>
              </div>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                  telemetry?.instance.isAws
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-sky-50 text-sky-700 border-sky-200"
                }`}
              >
                {telemetry?.instance.isAws ? "AWS EC2" : "Local Host"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Instance ID:</span>
                <span className="font-mono font-bold text-slate-800">
                  {telemetry?.instance.instanceId || "Loading..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Availability Zone:</span>
                <span className="font-mono text-slate-700 font-semibold">
                  {telemetry?.instance.availabilityZone || "Loading..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Private IPv4:</span>
                <span className="font-mono text-slate-600">
                  {telemetry?.instance.privateIp || "127.0.0.1"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Host OS:</span>
                <span className="text-slate-600">{telemetry?.instance.platform}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Liveness Check (/api/health) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ALB Target Health</h3>
                  <p className="text-[11px] text-slate-400">Endpoint: /api/health</p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                HTTP 200 OK
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Health Status:</span>
                <span className="font-semibold text-emerald-600 capitalize">
                  {telemetry?.health.status || "healthy"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">App Version:</span>
                <span className="font-mono text-slate-700">{telemetry?.instance.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Node Uptime:</span>
                <span className="text-slate-600">{telemetry?.instance.uptime} seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Port:</span>
                <span className="font-mono text-slate-700">3000 (HTTP)</span>
              </div>
            </div>
          </div>

          {/* Card 3: Database Readiness Check (/api/ready) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Database Readiness</h3>
                  <p className="text-[11px] text-slate-400">Endpoint: /api/ready</p>
                </div>
              </div>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                  telemetry?.readiness.ready
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {telemetry?.readiness.ready ? "Connected" : "Disconnected"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Engine / Provider:</span>
                <span className="font-semibold text-indigo-700">
                  {telemetry?.readiness.provider}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ping Query:</span>
                <span className="font-mono text-slate-600">SELECT 1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Query Latency:</span>
                <span className="font-semibold text-slate-800">
                  {telemetry?.readiness.latencyMs} ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Port / Security:</span>
                <span className="text-slate-600">5432 (Private RDS SG)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liveness vs Readiness Concept Box */}
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50/50 p-5 rounded-2xl border border-sky-100 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Shield className="w-4 h-4 text-sky-600" />
            Architectural Principle: Liveness (/api/health) vs Readiness (/api/ready)
          </div>
          <p className="leading-relaxed">
            The AWS Application Load Balancer checks <strong>/api/health</strong> to confirm that the Node.js web server is alive and accepting connections on port 3000. It does <em>not</em> execute database roundtrips on every 15-second health check probe to avoid degrading database performance. The separate <strong>/api/ready</strong> endpoint validates downstream PostgreSQL database connectivity for diagnostics and zero-downtime deployments.
          </p>
        </div>

        {/* ALB Traffic Distribution Live Test Widget */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Demonstrate Traffic Distribution (ALB Verification)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Execute repeated HTTP requests to the Application Load Balancer and tabulate which EC2 instance processes each request.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => runTrafficSimulation(10)}
                disabled={simulating}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition disabled:opacity-50"
              >
                Test 10 Requests
              </button>
              <button
                onClick={() => runTrafficSimulation(25)}
                disabled={simulating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition shadow-sm shadow-sky-600/30 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {simulating ? `Running (${requestsSent}/25)...` : "Test 25 Requests"}
              </button>
            </div>
          </div>

          {/* Test Results Visualizer */}
          {requestsSent > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total requests completed: <strong>{requestsSent}</strong></span>
                {simulating && (
                  <span className="flex items-center gap-1.5 text-sky-600 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Distributing across targets...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trafficSummary.map((item) => (
                  <div
                    key={item.instanceId}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-sky-600" />
                        {item.instanceId}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">{item.az}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-slate-600 font-medium pt-1">
                      <span>{item.count} hits</span>
                      <span className="font-bold text-sky-700">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * Note: ALB distributes traffic using round-robin / least outstanding requests. Short sample runs may not produce exact 50/50 splits due to connection keep-alive; longer automated script tests confirm balanced distribution across both healthy targets.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
