import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, invoices, customerInventory, customerDues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const orderId = parseInt(id);
    
    const body = await req.json();
    const { deliveryCode } = body;

    if (!deliveryCode) {
      return NextResponse.json({ error: "Delivery code is required" }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order is in the right status
    if (order.status !== "invoiced") {
      return NextResponse.json({ 
        error: "Order must be invoiced before delivery can be confirmed" 
      }, { status: 400 });
    }

    // Verify delivery code
    if (order.deliveryCode !== deliveryCode) {
      return NextResponse.json({ 
        error: "Invalid delivery code. Please verify the code with the customer." 
      }, { status: 400 });
    }

    // Update order status to delivered
    await db.update(orders)
      .set({ 
        status: "delivered", 
        updatedAt: new Date().toISOString() 
      })
      .where(eq(orders.id, orderId));

    // Update invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.orderId, orderId),
    });
    
    if (invoice) {
      await db.update(invoices)
        .set({ 
          status: "confirmed", 
          deliveryConfirmedAt: new Date().toISOString() 
        })
        .where(eq(invoices.id, invoice.id));

      // Add to customer dues
      await db.insert(customerDues).values({
        userId: order.userId,
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        paidAmount: 0,
        status: "outstanding",
      });
    }

    // Update customer inventory
    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
    });
    
    for (const item of items) {
      const qty = item.adminQuantity || item.quantity;
      
      const existing = await db.query.customerInventory.findFirst({
        where: eq(customerInventory.variantId, item.variantId),
      });

      if (existing) {
        await db.update(customerInventory)
          .set({ 
            currentQty: existing.currentQty + qty,
            updatedAt: new Date().toISOString()
          })
          .where(eq(customerInventory.id, existing.id));
      } else {
        await db.insert(customerInventory).values({
          userId: order.userId,
          variantId: item.variantId,
          currentQty: qty,
          minStockLevel: 0,
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Delivery confirmed successfully" 
    });
  } catch (error) {
    console.error("Delivery confirm error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
