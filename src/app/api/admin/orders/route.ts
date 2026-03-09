import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, users, productVariants, products, invoices, customerInventory, customerDues } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    
    const orderList = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        type: orders.type,
        status: orders.status,
        notes: orders.notes,
        adminNotes: orders.adminNotes,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        userId: orders.userId,
        businessName: users.businessName,
        contactPerson: users.contactPerson,
        email: users.email,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({ orders: orderList });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await req.json();
    const { orderId, status, adminNotes, items } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    // Update order
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    // Update order items if provided
    if (items) {
      let total = 0;
      for (const item of items) {
        const qty = item.adminQuantity || item.quantity;
        const price = item.adminUnitPrice || item.unitPrice;
        total += qty * price;
        
        await db.update(orderItems)
          .set({
            adminQuantity: item.adminQuantity,
            adminUnitPrice: item.adminUnitPrice,
            notes: item.notes,
          })
          .where(eq(orderItems.id, item.id));
      }
      updateData.totalAmount = total;
    }

    await db.update(orders).set(updateData).where(eq(orders.id, orderId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
