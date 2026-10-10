"use client";

import { useEffect, useState } from "react";
import { Server, RefreshCw, Cpu } from "lucide-react";

interface InstanceData {
  instanceId: string;
  availabilityZone: string;
  hostname: string;
  isAws: boolean;
}

export function InstanceBadge() {
  const [data, setData] = useState<InstanceData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInstance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/instance", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstance();
  }, []);

  if (!data) {
    return (
      <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white/70 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm animate-pulse">
        <Server className="w-3.5 h-3.5 text-slate-400" />
        <span>Detecting host...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2 text-xs bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200/80 shadow-sm">
        <div className={`w-2 h-2 rounded-full ${data.isAws ? "bg-emerald-500 animate-pulse" : "bg-sky-500"}`} />
        <span className="font-semibold text-slate-700 flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          {data.instanceId}
        </span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-500 text-[11px] font-mono">{data.availabilityZone}</span>
        <button
          onClick={fetchInstance}
          title="Query load balancer to check serving instance"
          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-sky-600" : ""}`} />
        </button>
      </div>
    </div>
  );
}
