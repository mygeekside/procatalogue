import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, invoices, customerInventory, customerDues } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "customer" || session.status !== "approved") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    const order = (await db.select().from(orders).where(
      and(eq(orders.id, orderId), eq(orders.userId, session.userId))
    ).limit(1))[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "invoiced" && order.status !== "delivered") {
      return NextResponse.json({ error: "Order not ready for delivery confirmation" }, { status: 400 });
    }

    // Update order status
    await db.update(orders)
      .set({ status: "completed", updatedAt: new Date().toISOString() })
      .where(eq(orders.id, orderId));

    // Update invoice
    const invoice = (await db.select().from(invoices).where(eq(invoices.orderId, orderId)).limit(1))[0];
    if (invoice) {
      await db.update(invoices)
        .set({ status: "confirmed", deliveryConfirmedAt: new Date().toISOString() })
        .where(eq(invoices.id, invoice.id));

      // Add to customer dues
      await db.insert(customerDues).values({
        userId: session.userId,
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        paidAmount: 0,
        status: "outstanding",
      });
    }

    // Update customer inventory
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    
    for (const item of items) {
      const qty = item.adminQuantity || item.quantity;
      
      const existing = (await db.select().from(customerInventory).where(
        and(
          eq(customerInventory.userId, session.userId),
          eq(customerInventory.variantId, item.variantId)
        )
      ).limit(1))[0];

      if (existing) {
        await db.update(customerInventory)
          .set({ 
            currentQty: existing.currentQty + qty,
            updatedAt: new Date().toISOString()
          })
          .where(eq(customerInventory.id, existing.id));
      } else {
        await db.insert(customerInventory).values({
          userId: session.userId,
          variantId: item.variantId,
          currentQty: qty,
          minStockLevel: 0,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delivery confirm error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
