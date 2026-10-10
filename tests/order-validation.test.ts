import { describe, it, expect } from "vitest";
import { createOrderSchema } from "../lib/types";

describe("Order Validation Tests", () => {
  it("should validate a valid college merchandise order", () => {
    const validData = {
      customerName: "Rahul Sharma",
      amount: 1250.5,
      status: "paid",
      itemsSummary: "Official Tech Club Hoodie (Size M)",
    };

    const result = createOrderSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customerName).toBe("Rahul Sharma");
      expect(result.data.amount).toBe(1250.5);
      expect(result.data.status).toBe("paid");
    }
  });

  it("should reject an order with empty or too short customer name", () => {
    const invalidData = {
      customerName: "A",
      amount: 500,
      status: "pending",
      itemsSummary: "Lapel Pin",
    };

    const result = createOrderSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.customerName).toBeDefined();
    }
  });

  it("should reject an order with zero or negative amount", () => {
    const zeroAmount = {
      customerName: "Priya Nair",
      amount: 0,
      status: "pending",
      itemsSummary: "Free Event Pass",
    };

    const resultZero = createOrderSchema.safeParse(zeroAmount);
    expect(resultZero.success).toBe(false);

    const negativeAmount = {
      customerName: "Priya Nair",
      amount: -100,
      status: "pending",
      itemsSummary: "Event Pass",
    };

    const resultNeg = createOrderSchema.safeParse(negativeAmount);
    expect(resultNeg.success).toBe(false);
  });

  it("should reject invalid order status enum values", () => {
    const invalidStatus = {
      customerName: "Sneha K",
      amount: 450,
      status: "cancelled", // Not in ["pending", "paid", "shipped"]
      itemsSummary: "Club Coffee Mug",
    };

    const result = createOrderSchema.safeParse(invalidStatus);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.status).toBeDefined();
    }
  });

  it("should provide default itemsSummary when omitted", () => {
    const minimalData = {
      customerName: "Ananya Iyer",
      amount: 250,
    };

    const result = createOrderSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("pending");
      expect(result.data.itemsSummary).toBe("Club Official Merchandise");
    }
  });
});
