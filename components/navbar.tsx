"use client";

import { InstanceBadge } from "./instance-badge";
import { Database, ShieldCheck } from "lucide-react";

export function Navbar({ title }: { title: string }) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center space-x-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200/70 font-medium">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>PostgreSQL Live</span>
        </div>

        <div className="hidden md:flex items-center space-x-1.5 text-xs bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-full font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          <span>IAM Least-Privilege</span>
        </div>

        <InstanceBadge />
      </div>
    </header>
  );
}
