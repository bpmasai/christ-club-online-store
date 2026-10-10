import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrder, getOrderStats } from "@/lib/db";
import { createOrderSchema } from "@/lib/types";

/**
 * GET /api/orders
 * Returns orders list from PostgreSQL (or local fallback).
 * Supports ?status=pending|paid|shipped query filter, or ?stats=true for dashboard summary.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const includeStats = searchParams.get("stats") === "true";

    const orders = await getOrders(status);

    if (includeStats) {
      const stats = await getOrderStats();
      return NextResponse.json({ orders, stats }, { status: 200 });
    }

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Internal Server Error retrieving orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Creates a new order record with strict Zod validation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const created = await createOrder(validation.data);

    return NextResponse.json(
      {
        message: "Order successfully created",
        order: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Internal Server Error creating order" },
      { status: 500 }
    );
  }
}
