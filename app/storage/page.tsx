"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import {
  HardDrive,
  Cloud,
  FileCheck,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Server,
  Info,
} from "lucide-react";

interface StorageStatusResponse {
  instance: {
    instanceId: string;
    availabilityZone: string;
    isAws: boolean;
  };
  ebs: {
    storageType: string;
    mountPath: string;
    isMounted: boolean;
    sampleFileExists: boolean;
    sampleFileName: string;
    fileSize?: number;
    lastModified?: string;
    previewContent?: string;
    message: string;
  };
  s3: {
    storageType: string;
    bucketName: string;
    region: string;
    isMock: boolean;
    sampleFileExists: boolean;
    sampleFileName: string;
    fileSize?: number;
    lastModified?: string;
    etag?: string;
    previewContent?: string;
    message: string;
  };
}

export default function StoragePage() {
  const [data, setData] = useState<StorageStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [ebsNote, setEbsNote] = useState("Manual evaluation verification checkpoint.");
  const [s3Note, setS3Note] = useState("Order catalog export artifact.");
  const [ebsWriting, setEbsWriting] = useState(false);
  const [s3Uploading, setS3Uploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/storage/status", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleWriteEbs = async () => {
    setEbsWriting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/storage/ebs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "sample-order-file.txt",
          customNote: ebsNote,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to write EBS file");
      setFeedback({ type: "success", msg: "Successfully wrote sample-order-file.txt to Amazon EBS filesystem!" });
      fetchStatus();
    } catch (err: unknown) {
      setFeedback({ type: "error", msg: (err as Error).message });
    } finally {
      setEbsWriting(false);
    }
  };

  const handleUploadS3 = async () => {
    setS3Uploading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/storage/s3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "sample-s3-file.txt",
          customNote: s3Note,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload S3 file");
      setFeedback({
        type: "success",
        msg: json.result.isMock
          ? "File successfully stored in local simulated S3 bucket!"
          : `File successfully uploaded to Amazon S3 bucket (s3://${json.result.bucket}) via IAM Role!`,
      });
      fetchStatus();
    } catch (err: unknown) {
      setFeedback({ type: "error", msg: (err as Error).message });
    } finally {
      setS3Uploading(false);
    }
  };

  return (
    <>
      <Navbar title="Storage Demonstrations (EBS & S3)" />
      <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Header / Intro */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Assignment Requirement 4
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-2">
                Hybrid Storage: Amazon EBS & Amazon S3
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl">
                Demonstrating the fundamental architectural contrast between <strong>Block Storage</strong> (Amazon EBS gp3 mounted to an EC2 instance filesystem) and <strong>Object Storage</strong> (Amazon S3 bucket accessed via AWS SDK with IAM Role authorization).
              </p>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Global Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 shadow-xs ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Storage Demonstrations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Amazon EBS (Block Storage) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Amazon EBS (gp3)</h3>
                    <p className="text-xs text-slate-500 font-mono">Block Storage Volume</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    data?.ebs.isMounted
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {data?.ebs.isMounted ? "Mounted" : "Unmounted"}
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mount Location:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {data?.ebs.mountPath || "/mnt/demo-ebs"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target File:</span>
                  <span className="font-mono text-slate-700 font-medium">sample-order-file.txt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File Existence:</span>
                  <span
                    className={`font-semibold ${
                      data?.ebs.sampleFileExists ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {data?.ebs.sampleFileExists ? "Verified on Disk" : "Not Found"}
                  </span>
                </div>
                {data?.ebs.fileSize !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Size / Modified:</span>
                    <span className="text-slate-700">
                      {data.ebs.fileSize} bytes • {new Date(data.ebs.lastModified || "").toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Message */}
              <p className="text-xs text-slate-600 leading-relaxed bg-sky-50/50 p-3 rounded-lg border border-sky-100">
                <Info className="w-3.5 h-3.5 inline mr-1 text-sky-600" />
                {data?.ebs.message}
              </p>

              {/* Action Form */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Custom Operator Note for EBS:
                </label>
                <input
                  type="text"
                  value={ebsNote}
                  onChange={(e) => setEbsNote(e.target.value)}
                  placeholder="Enter note for EBS sample payload"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <button
                  onClick={handleWriteEbs}
                  disabled={ebsWriting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition shadow-sm shadow-sky-600/30 disabled:opacity-50"
                >
                  {ebsWriting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                  {ebsWriting ? "Writing to Filesystem..." : "Write File to EBS (sample-order-file.txt)"}
                </button>
              </div>

              {/* Content Preview */}
              {data?.ebs.previewContent && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> File Content on Mounted Volume:
                  </span>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-40">
                    {data.ebs.previewContent}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
              <strong>AZ Constraint:</strong> Ordinary EBS volumes are attached to only <em>one</em> EC2 instance in a single Availability Zone (Instance A).
            </div>
          </div>

          {/* Card 2: Amazon S3 (Object Storage) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Amazon S3</h3>
                    <p className="text-xs text-slate-500 font-mono">Private Object Storage</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    data?.s3.isMock
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {data?.s3.isMock ? "Local Simulated" : "Live AWS S3"}
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 space-y-5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">S3 Bucket Name:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    s3://{data?.s3.bucketName || "christ-club-store-storage-demo"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Object Key:</span>
                  <span className="font-mono text-slate-700 font-medium">sample-s3-file.txt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Object Status:</span>
                  <span
                    className={`font-semibold ${
                      data?.s3.sampleFileExists ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {data?.s3.sampleFileExists ? "Verified in Bucket" : "Not Found"}
                  </span>
                </div>
                {data?.s3.etag && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">ETag (MD5 Checksum):</span>
                    <span className="font-mono text-[10px] text-slate-700">{data.s3.etag}</span>
                  </div>
                )}
              </div>

              {/* Status Message */}
              <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-indigo-600" />
                {data?.s3.message}
              </p>

              {/* Action Form */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Custom Payload Note for S3:
                </label>
                <input
                  type="text"
                  value={s3Note}
                  onChange={(e) => setS3Note(e.target.value)}
                  placeholder="Enter note for S3 sample payload"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  onClick={handleUploadS3}
                  disabled={s3Uploading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-sm shadow-indigo-600/30 disabled:opacity-50"
                >
                  {s3Uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {s3Uploading ? "Uploading to S3..." : "Upload Object to S3 (sample-s3-file.txt)"}
                </button>
              </div>

              {/* Content Preview */}
              {data?.s3.previewContent && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Object Content in S3:
                  </span>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-40">
                    {data.s3.previewContent}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
              <strong>Multi-Instance Access:</strong> S3 is accessible from <em>both</em> EC2 Instance A and Instance B using IAM Instance Profiles without embedding secrets.
            </div>
          </div>
        </div>

        {/* Educational Architectural Comparison */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-600" />
            Architectural Comparison: Amazon EBS vs Amazon S3
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="py-2.5 px-4">Feature</th>
                  <th className="py-2.5 px-4">Amazon EBS (gp3)</th>
                  <th className="py-2.5 px-4">Amazon S3 (Standard)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-4 font-semibold">Storage Category</td>
                  <td className="py-2.5 px-4">Block Storage (Raw unformatted device)</td>
                  <td className="py-2.5 px-4">Object Storage (Key-Value, Metadata)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold">Accessibility</td>
                  <td className="py-2.5 px-4">Mounted locally via POSIX filesystem (`/mnt/demo-ebs`)</td>
                  <td className="py-2.5 px-4">REST API / AWS SDK v3 (`PutObjectCommand`)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold">Availability Scope</td>
                  <td className="py-2.5 px-4">Locked to a single Availability Zone</td>
                  <td className="py-2.5 px-4">Multi-AZ Regional redundancy (11 9s durability)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold">Authentication</td>
                  <td className="py-2.5 px-4">OS file permissions (POSIX chmod/chown)</td>
                  <td className="py-2.5 px-4">AWS IAM Role & Bucket Policies (Least-privilege)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold">Ideal Use Case</td>
                  <td className="py-2.5 px-4">Databases, OS boot disks, low-latency disk I/O</td>
                  <td className="py-2.5 px-4">Static media, order exports, PDF receipts, backups</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
