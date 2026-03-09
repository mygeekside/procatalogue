import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productVariants } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    const variants = await db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.productId, productId), eq(productVariants.isActive, true)));

    return NextResponse.json({ variants });
  } catch (error) {
    console.error("Variants error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
