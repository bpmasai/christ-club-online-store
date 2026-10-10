import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";

/**
 * GET /api/orders/[id]
 * Retrieves an individual order by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { error: `Order with ID '${id}' was not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error retrieving order details" },
      { status: 500 }
    );
  }
}
