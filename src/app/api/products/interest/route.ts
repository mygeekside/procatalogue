import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productInterests } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();
    
    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const sessionId = req.cookies.get("session_id")?.value || Math.random().toString(36);

    await db.insert(productInterests).values({
      productId,
      sessionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Interest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
