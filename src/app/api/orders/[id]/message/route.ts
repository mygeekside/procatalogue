import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(
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
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 });
    }

    // Verify order access
    const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (session.role !== "admin" && order.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await db.insert(messages).values({
      orderId,
      senderId: session.userId,
      content: content.trim(),
    }).returning();

    return NextResponse.json({ success: true, message: message[0] });
  } catch (error) {
    console.error("Message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (session.role !== "admin" && order.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messageList = await db.select().from(messages).where(eq(messages.orderId, orderId)).orderBy(messages.createdAt);

    return NextResponse.json({ messages: messageList });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
