"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  HardDrive,
  Activity,
  GraduationCap,
  Cloud,
  CheckCircle2,
} from "lucide-react";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    badge: "Overview",
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingBag,
    badge: "RDS PostgreSQL",
  },
  {
    name: "Storage Demo",
    href: "/storage",
    icon: HardDrive,
    badge: "EBS & S3",
  },
  {
    name: "Infrastructure Status",
    href: "/infrastructure",
    icon: Activity,
    badge: "ALB & EC2",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none">
              Christ Club Store
            </h1>
            <p className="text-xs text-sky-400 mt-1 font-medium flex items-center gap-1">
              <Cloud className="w-3 h-3" /> AWS Cloud Project
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Management Console
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-sky-600 text-white shadow-sm shadow-sky-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isActive
                    ? "bg-sky-700/60 text-sky-100"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {item.badge}
              </span>
            </Link>
          );
        })}

        {/* Assignment Checklist Card */}
        <div className="mt-8 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs">
          <p className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            MSc AIML 4 AWS Goals
          </p>
          <ul className="space-y-1.5 text-slate-300 text-[11px]">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              1. 2x EC2 Multi-AZ
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              2. ALB Traffic Distribution
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              3. Amazon RDS PostgreSQL
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              4. EBS Block & S3 Object
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span>Student Build</span>
          <span className="font-mono text-slate-300">v1.0.0</span>
        </div>
        <p className="text-[10px] text-slate-400">Department of AI & ML</p>
      </div>
    </aside>
  );
}
