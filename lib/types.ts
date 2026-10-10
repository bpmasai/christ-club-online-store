import { z } from "zod";

// Zod Schema for Order creation validation
export const createOrderSchema = z.object({
  customerName: z
    .string()
    .min(2, "Customer name must be at least 2 characters long")
    .max(100, "Customer name cannot exceed 100 characters"),
  amount: z
    .coerce
    .number()
    .positive("Order amount must be greater than zero")
    .max(1000000, "Order amount cannot exceed ₹1,000,000"),
  status: z.enum(["pending", "paid", "shipped"]).default("pending"),
  itemsSummary: z
    .string()
    .min(3, "Items summary must be at least 3 characters long")
    .max(255, "Items summary cannot exceed 255 characters")
    .default("Club Official Merchandise"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export interface OrderRecord {
  id: string;
  customerName: string;
  amount: number;
  status: "pending" | "paid" | "shipped";
  itemsSummary: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingCount: number;
  paidCount: number;
  shippedCount: number;
  recentOrders: OrderRecord[];
}

export interface InstanceMetadata {
  instanceId: string;
  availabilityZone: string;
  privateIp: string;
  hostname: string;
  isAws: boolean;
  appVersion: string;
  uptime: number;
  platform: string;
  nodeVersion: string;
}
