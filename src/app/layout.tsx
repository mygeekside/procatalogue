import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users, carts, cartItems } from "@/db/schema";
import { eq, count } from "drizzle-orm";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProCatalogue - Product Catalogue & Ordering",
  description: "Browse products, place orders, and manage your business inventory",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  
  let userInfo = null;
  let cartCount = 0;

  if (session) {
    const userResult = await db.select({
      email: users.email,
      role: users.role,
      status: users.status,
      businessName: users.businessName,
    }).from(users).where(eq(users.id, session.userId)).limit(1);
    
    if (userResult[0]) {
      userInfo = userResult[0];
    }

    if (session.role === "customer" && session.status === "approved") {
      const cartResult = await db.select().from(carts).where(eq(carts.userId, session.userId)).limit(1);
      if (cartResult[0]) {
        const countResult = await db.select({ count: count() }).from(cartItems).where(eq(cartItems.cartId, cartResult[0].id));
        cartCount = countResult[0]?.count || 0;
      }
    }
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased bg-gray-50 min-h-screen`}>
        <Navbar user={userInfo} cartCount={cartCount} />
        <main>{children}</main>
      </body>
    </html>
  );
}
