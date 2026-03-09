import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerInventory, productVariants, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "customer" || session.status !== "approved") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await db
      .select({
        id: customerInventory.id,
        currentQty: customerInventory.currentQty,
        minStockLevel: customerInventory.minStockLevel,
        variantId: customerInventory.variantId,
        variantName: productVariants.name,
        productName: products.name,
        productSlug: products.slug,
      })
      .from(customerInventory)
      .innerJoin(productVariants, eq(customerInventory.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(customerInventory.userId, session.userId));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Inventory fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "customer" || session.status !== "approved") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, currentQty, minStockLevel } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Inventory item ID required" }, { status: 400 });
    }

    await db.update(customerInventory)
      .set({
        currentQty,
        minStockLevel,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customerInventory.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inventory update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
