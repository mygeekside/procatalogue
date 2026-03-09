import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, productVariants, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "customer" || session.status !== "approved") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = (await db.select().from(carts).where(eq(carts.userId, session.userId)).limit(1))[0];
    
    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    const items = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        variantId: cartItems.variantId,
        variantName: productVariants.name,
        productName: products.name,
        productSlug: products.slug,
        price: productVariants.price,
        moq: productVariants.moq,
        stockQty: productVariants.stockQty,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Cart fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
