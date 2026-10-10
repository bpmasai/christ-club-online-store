import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { OrderRecord, OrderStats, CreateOrderInput } from "./types";

// Global Prisma instance to prevent connection pooling exhaustion in development
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const isPostgresConfigured = (): boolean => {
  const url = process.env.DATABASE_URL || "";
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
};

export const prisma: PrismaClient =
  globalThis.prismaGlobal ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

// -----------------------------------------------------------------------------
// LOCAL FALLBACK DATA (For zero-friction local testing on laptop without PostgreSQL)
// -----------------------------------------------------------------------------
const LOCAL_STORE_PATH = path.resolve("./data/local-orders.json");

const INITIAL_SAMPLE_ORDERS: OrderRecord[] = [
  {
    id: "ord_christ_001",
    customerName: "Arjun Sharma",
    amount: 1250.0,
    status: "paid",
    itemsSummary: "Christ Tech Club Navy Hoodie (Size L)",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "ord_christ_002",
    customerName: "Priya Nair",
    amount: 350.0,
    status: "pending",
    itemsSummary: "Annual AI Summit Hackathon Badge & Lanyard",
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: "ord_christ_003",
    customerName: "Rohan Verma",
    amount: 600.0,
    status: "shipped",
    itemsSummary: "Robotics Club Brass Lapel Pin & Ceramic Coffee Mug",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "ord_christ_004",
    customerName: "Sneha Kulkarni",
    amount: 1500.0,
    status: "paid",
    itemsSummary: "Christ Cultural Fest VIP Delegate Pass",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: "ord_christ_005",
    customerName: "David D'Souza",
    amount: 850.0,
    status: "pending",
    itemsSummary: "Department of AI Sports Jersey (Size M)",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "ord_christ_006",
    customerName: "Ananya Iyer",
    amount: 450.0,
    status: "shipped",
    itemsSummary: "Christ AI Club Stainless Steel Insulated Bottle",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "ord_christ_007",
    customerName: "Karthik Reddy",
    amount: 2200.0,
    status: "paid",
    itemsSummary: "Winter Merchandise Bundle (Hoodie, Cap, Thermal Mug)",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

function getLocalOrders(): OrderRecord[] {
  try {
    if (!fs.existsSync(LOCAL_STORE_PATH)) {
      const dir = path.dirname(LOCAL_STORE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(INITIAL_SAMPLE_ORDERS, null, 2), "utf-8");
      return INITIAL_SAMPLE_ORDERS;
    }
    const data = fs.readFileSync(LOCAL_STORE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return INITIAL_SAMPLE_ORDERS;
  }
}

function saveLocalOrders(orders: OrderRecord[]): void {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist local orders:", err);
  }
}

// -----------------------------------------------------------------------------
// UNIFIED DATA ACCESS METHODS (Prisma RDS PostgreSQL + Local Fallback)
// -----------------------------------------------------------------------------

export async function getOrders(filterStatus?: string): Promise<OrderRecord[]> {
  if (isPostgresConfigured()) {
    try {
      const whereClause = filterStatus && filterStatus !== "all" ? { status: filterStatus as "pending" | "paid" | "shipped" } : {};
      const rows = await prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });
      return rows.map((r) => ({
        id: r.id,
        customerName: r.customerName,
        amount: Number(r.amount),
        status: r.status as "pending" | "paid" | "shipped",
        itemsSummary: r.itemsSummary,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    } catch {
      // If Postgres connection fails (e.g. running locally without DB), fallback gracefully
    }
  }

  const localOrders = getLocalOrders();
  if (filterStatus && filterStatus !== "all") {
    return localOrders.filter((o) => o.status === filterStatus);
  }
  return localOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrderById(id: string): Promise<OrderRecord | null> {
  if (isPostgresConfigured()) {
    try {
      const r = await prisma.order.findUnique({ where: { id } });
      if (r) {
        return {
          id: r.id,
          customerName: r.customerName,
          amount: Number(r.amount),
          status: r.status as "pending" | "paid" | "shipped",
          itemsSummary: r.itemsSummary,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
      }
    } catch {
      // Fallback
    }
  }

  const localOrders = getLocalOrders();
  return localOrders.find((o) => o.id === id) || null;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderRecord> {
  if (isPostgresConfigured()) {
    try {
      const created = await prisma.order.create({
        data: {
          customerName: input.customerName,
          amount: input.amount,
          status: input.status,
          itemsSummary: input.itemsSummary,
        },
      });
      return {
        id: created.id,
        customerName: created.customerName,
        amount: Number(created.amount),
        status: created.status as "pending" | "paid" | "shipped",
        itemsSummary: created.itemsSummary,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch {
      // Fallback
    }
  }

  const newOrder: OrderRecord = {
    id: `ord_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    customerName: input.customerName,
    amount: input.amount,
    status: input.status,
    itemsSummary: input.itemsSummary,
    createdAt: new Date().toISOString(),
  };

  const current = getLocalOrders();
  current.unshift(newOrder);
  saveLocalOrders(current);
  return newOrder;
}

export async function getOrderStats(): Promise<OrderStats> {
  const allOrders = await getOrders();
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingCount = allOrders.filter((o) => o.status === "pending").length;
  const paidCount = allOrders.filter((o) => o.status === "paid").length;
  const shippedCount = allOrders.filter((o) => o.status === "shipped").length;
  const recentOrders = allOrders.slice(0, 5);

  return {
    totalOrders,
    totalRevenue,
    pendingCount,
    paidCount,
    shippedCount,
    recentOrders,
  };
}

export interface DatabaseReadiness {
  ready: boolean;
  latencyMs: number;
  provider: "Amazon RDS PostgreSQL" | "Local File Store";
  message: string;
}

export async function checkDatabaseReadiness(): Promise<DatabaseReadiness> {
  const start = Date.now();
  if (isPostgresConfigured()) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;
      return {
        ready: true,
        latencyMs,
        provider: "Amazon RDS PostgreSQL",
        message: "Successfully connected to Amazon RDS PostgreSQL database via Prisma ORM.",
      };
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || "Database connection failed";
      return {
        ready: false,
        latencyMs: Date.now() - start,
        provider: "Amazon RDS PostgreSQL",
        message: `Database unreachable: ${errorMsg}`,
      };
    }
  }

  // Local development mode
  return {
    ready: true,
    latencyMs: 1,
    provider: "Local File Store",
    message: "Operating in local simulation mode. Connected to local order store.",
  };
}
