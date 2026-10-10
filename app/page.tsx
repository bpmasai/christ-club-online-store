"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  HardDrive,
  Activity,
} from "lucide-react";
import { OrderRecord, OrderStats } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders?stats=true", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load dashboard metrics");
      const json = await res.json();
      setStats(json.stats);
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <>
      <Navbar title="Order Management Dashboard" />
      <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-slate-800">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 mb-3">
              <TrendingUp className="w-3.5 h-3.5" /> Live Cloud Telemetry
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Christ Club Online Store
            </h1>
            <p className="text-slate-300 text-sm md:text-base mt-2 leading-relaxed">
              Order management engine hosted on multi-AZ AWS infrastructure. Demonstrating Amazon EC2, Application Load Balancer traffic balancing, Amazon RDS PostgreSQL, EBS block volumes, and Amazon S3.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition shadow-md shadow-sky-500/20"
              >
                <PlusCircle className="w-4 h-4" /> Place New Order
              </Link>
              <Link
                href="/infrastructure"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium text-sm transition border border-slate-700"
              >
                <Activity className="w-4 h-4" /> View ALB & EC2 Nodes
              </Link>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-800 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Failed to load telemetry</h4>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
            <button
              onClick={fetchStats}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Orders */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Orders
              </span>
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-slate-900">{stats?.totalOrders ?? 0}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">Persisted in RDS PostgreSQL</p>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Revenue
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-slate-900">
                  ₹{(stats?.totalRevenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">Calculated via SQL SUM</p>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Orders
              </span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-14 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-amber-600">{stats?.pendingCount ?? 0}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">Awaiting confirmation</p>
            </div>
          </div>

          {/* Paid / Shipped Orders */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completed / Paid
              </span>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-14 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-indigo-600">
                  {(stats?.paidCount ?? 0) + (stats?.shippedCount ?? 0)}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {stats?.paidCount ?? 0} Paid, {stats?.shippedCount ?? 0} Shipped
              </p>
            </div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Recent Club Orders</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time records queried from PostgreSQL database
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchStats}
                disabled={loading}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-600" : ""}`} />
              </button>
              <Link
                href="/orders"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Order ID</th>
                  <th className="py-3 px-5">Customer Name</th>
                  <th className="py-3 px-5">Club Merchandise</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                        Loading orders from PostgreSQL...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && (!stats?.recentOrders || stats.recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-600">No orders recorded yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Use the Orders page to create your first order or run the seed script.
                      </p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  stats?.recentOrders?.map((order: OrderRecord) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-5 font-mono text-xs text-slate-600 font-medium">
                        {order.id}
                      </td>
                      <td className="py-3 px-5 font-semibold text-slate-800">
                        {order.customerName}
                      </td>
                      <td className="py-3 px-5 text-slate-600 text-xs">
                        {order.itemsSummary}
                      </td>
                      <td className="py-3 px-5 font-semibold text-slate-900">
                        ₹{order.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 px-5 text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-xl bg-gradient-to-br from-white to-sky-50/40 border border-slate-200/80 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Storage Demonstration</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Interact with Amazon EBS gp3 mounted block filesystem and upload order artifacts to Amazon S3 private object storage.
              </p>
              <Link
                href="/storage"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 mt-2 inline-flex items-center gap-1"
              >
                Go to Storage Demo <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-gradient-to-br from-white to-indigo-50/40 border border-slate-200/80 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Application Load Balancer Status</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Observe live request routing across EC2 instances in different Availability Zones and verify target health endpoints.
              </p>
              <Link
                href="/infrastructure"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-2 inline-flex items-center gap-1"
              >
                Inspect Infrastructure <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function StatusBadge({ status }: { status: "pending" | "paid" | "shipped" }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Paid
      </span>
    );
  }
  if (status === "shipped") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        Shipped
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      Pending
    </span>
  );
}
