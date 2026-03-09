import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { businessName, contactPerson, email, phone, address, password } = await req.json();

    if (!email || !password || !businessName || !contactPerson) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing[0]) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      role: "customer",
      status: "pending",
      businessName,
      contactPerson,
      address,
      phone,
    });

    return NextResponse.json({ success: true, message: "Registration submitted for approval" });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
