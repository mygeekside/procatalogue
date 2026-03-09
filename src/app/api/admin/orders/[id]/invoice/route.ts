import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, invoices, customerDues, customerInventory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    
    const { id } = await params;
    const orderId = parseInt(id);

    const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    
    // Calculate total using admin overrides if available
    const total = items.reduce((sum, item) => {
      const qty = item.adminQuantity || item.quantity;
      const price = item.adminUnitPrice || item.unitPrice;
      return sum + qty * price;
    }, 0);

    // Create invoice
    const invoiceResult = await db.insert(invoices).values({
      orderId,
      invoiceNumber: generateInvoiceNumber(),
      totalAmount: total,
      status: "sent",
    }).returning();

    const invoice = invoiceResult[0];

    // Update order status
    await db.update(orders)
      .set({ status: "invoiced", totalAmount: total, updatedAt: new Date().toISOString() })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("Invoice create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
