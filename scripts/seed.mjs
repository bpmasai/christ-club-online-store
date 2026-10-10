// Idempotent Seed Script for Christ Club Online Store
// Inserts realistic college club merchandise orders into the database.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SAMPLE_ORDERS = [
  {
    customerName: "Arjun Sharma",
    amount: 1250.0,
    status: "paid",
    itemsSummary: "Christ Tech Club Navy Hoodie (Size L)",
  },
  {
    customerName: "Priya Nair",
    amount: 350.0,
    status: "pending",
    itemsSummary: "Annual AI Summit Hackathon Badge & Lanyard",
  },
  {
    customerName: "Rohan Verma",
    amount: 600.0,
    status: "shipped",
    itemsSummary: "Robotics Club Brass Lapel Pin & Ceramic Coffee Mug",
  },
  {
    customerName: "Sneha Kulkarni",
    amount: 1500.0,
    status: "paid",
    itemsSummary: "Christ Cultural Fest VIP Delegate Pass",
  },
  {
    customerName: "David D'Souza",
    amount: 850.0,
    status: "pending",
    itemsSummary: "Department of AI Sports Jersey (Size M)",
  },
  {
    customerName: "Ananya Iyer",
    amount: 450.0,
    status: "shipped",
    itemsSummary: "Christ AI Club Stainless Steel Insulated Bottle",
  },
  {
    customerName: "Karthik Reddy",
    amount: 2200.0,
    status: "paid",
    itemsSummary: "Winter Merchandise Bundle (Hoodie, Cap, Thermal Mug)",
  },
];

async function main() {
  console.log("Starting idempotent database seed for Christ Club Online Store...");

  const existingCount = await prisma.order.count();
  if (existingCount >= 5) {
    console.log(`Database already has ${existingCount} orders. Skipping duplicate insertion.`);
    return;
  }

  for (const orderData of SAMPLE_ORDERS) {
    const existing = await prisma.order.findFirst({
      where: {
        customerName: orderData.customerName,
        itemsSummary: orderData.itemsSummary,
      },
    });

    if (!existing) {
      const created = await prisma.order.create({
        data: orderData,
      });
      console.log(`+ Created order for '${created.customerName}' (Amount: ₹${created.amount})`);
    } else {
      console.log(`- Order already exists for '${orderData.customerName}'`);
    }
  }

  const finalCount = await prisma.order.count();
  console.log(`Seed complete! Total orders in database: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
