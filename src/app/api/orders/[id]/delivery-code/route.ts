import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

function generateDeliveryCode(): string {
  // Generate a 6-character alphanumeric code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET: Fetch delivery code for an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    
    const session = await getSession();
    if (!session || session.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow customer to view their own order's delivery code
    if (order.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      deliveryCode: order.deliveryCode,
      deliveryCodeGeneratedAt: order.deliveryCodeGeneratedAt,
    });
  } catch (error) {
    console.error("Error fetching delivery code:", error);
    return NextResponse.json({ error: "Failed to fetch delivery code" }, { status: 500 });
  }
}

// POST: Generate a new delivery code for an order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    
    const session = await getSession();
    if (!session || session.role !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow customer to generate code for their own order
    if (order.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Can only generate code for invoiced orders
    if (order.status !== "invoiced") {
      return NextResponse.json({ 
        error: "Delivery code can only be generated for invoiced orders" 
      }, { status: 400 });
    }

    // Generate a new delivery code
    const deliveryCode = generateDeliveryCode();
    const now = new Date().toISOString();

    await db.update(orders)
      .set({
        deliveryCode,
        deliveryCodeGeneratedAt: now,
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json({
      success: true,
      deliveryCode,
      deliveryCodeGeneratedAt: now,
    });
  } catch (error) {
    console.error("Error generating delivery code:", error);
    return NextResponse.json({ error: "Failed to generate delivery code" }, { status: 500 });
  }
}
