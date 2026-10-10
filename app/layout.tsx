import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Christ Club Online Store | AWS Cloud Architecture Demo",
  description:
    "Production-minded Order Management Web Application deployed across multi-AZ EC2, Application Load Balancer, Amazon RDS PostgreSQL, Amazon EBS gp3, and Amazon S3.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-slate-50 antialiased text-slate-800">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
