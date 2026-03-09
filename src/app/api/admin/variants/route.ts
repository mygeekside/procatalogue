import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Variant ID required" }, { status: 400 });
    }

    await db.update(productVariants)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(productVariants.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Variant update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
