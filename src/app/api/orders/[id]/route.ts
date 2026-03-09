import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, productVariants, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderResult[0]) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderResult[0];

    // Check access
    if (session.role !== "admin" && order.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    return NextResponse.json({ order, items: itemsResult });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
