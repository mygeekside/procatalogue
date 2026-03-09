import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "customer" || session.status !== "approved") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { variantId, quantity } = await req.json();

    if (!variantId || !quantity) {
      return NextResponse.json({ error: "Variant ID and quantity required" }, { status: 400 });
    }

    // Get or create cart
    let cart = (await db.select().from(carts).where(eq(carts.userId, session.userId)).limit(1))[0];
    
    if (!cart) {
      const result = await db.insert(carts).values({ userId: session.userId }).returning();
      cart = result[0];
    }

    // Check if item already in cart
    const existingItem = (await db.select().from(cartItems).where(
      and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId))
    ).limit(1))[0];

    if (existingItem) {
      await db.update(cartItems)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      await db.insert(cartItems).values({
        cartId: cart.id,
        variantId,
        quantity,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
