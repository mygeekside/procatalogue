import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, carts, cartItems, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "customer" || session.status !== "approved") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, notes } = await req.json();

    // Get cart
    const cart = (await db.select().from(carts).where(eq(carts.userId, session.userId)).limit(1))[0];
    if (!cart) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const items = await db
      .select({
        id: cartItems.id,
        variantId: cartItems.variantId,
        quantity: cartItems.quantity,
        price: productVariants.price,
        moq: productVariants.moq,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .where(eq(cartItems.cartId, cart.id));

    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order
    const orderResult = await db.insert(orders).values({
      userId: session.userId,
      orderNumber: generateOrderNumber(),
      type: type || "order",
      status: "pending",
      notes,
      totalAmount,
    }).returning();

    const order = orderResult[0];

    // Create order items
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
      });
    }

    // Clear cart
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let orderList;
    if (session.role === "admin") {
      orderList = await db.select().from(orders).orderBy(orders.createdAt);
    } else {
      orderList = await db.select().from(orders).where(eq(orders.userId, session.userId)).orderBy(orders.createdAt);
    }

    return NextResponse.json({ orders: orderList });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
