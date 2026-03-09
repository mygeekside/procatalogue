import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "customer" || session.status !== "approved") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, quantity } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    if (quantity <= 0) {
      // Remove item
      await db.delete(cartItems).where(eq(cartItems.id, itemId));
    } else {
      await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, itemId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "customer" || session.status !== "approved") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await req.json();
    await db.delete(cartItems).where(eq(cartItems.id, itemId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
