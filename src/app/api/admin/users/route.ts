import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    
    let query = db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      businessName: users.businessName,
      contactPerson: users.contactPerson,
      address: users.address,
      phone: users.phone,
      createdAt: users.createdAt,
    }).from(users);

    const allUsers = await query;
    
    const filtered = status ? allUsers.filter(u => u.status === status) : allUsers;
    
    return NextResponse.json({ users: filtered });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    
    const { userId, status } = await req.json();
    
    if (!userId || !status) {
      return NextResponse.json({ error: "User ID and status required" }, { status: 400 });
    }

    await db.update(users)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
