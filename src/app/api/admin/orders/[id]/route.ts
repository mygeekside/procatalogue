import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, users, productVariants, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    
    const { id } = await params;
    const orderId = parseInt(id);

    const orderResult = await db
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
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderResult[0]) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const itemsResult = await db
      .select({
        id: orderItems.id,
        variantId: orderItems.variantId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        adminQuantity: orderItems.adminQuantity,
        adminUnitPrice: orderItems.adminUnitPrice,
        notes: orderItems.notes,
        variantName: productVariants.name,
        productName: products.name,
      })
      .from(orderItems)
      .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return NextResponse.json({ order: orderResult[0], items: itemsResult });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
