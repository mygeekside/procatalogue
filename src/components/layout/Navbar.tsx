"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Package, User, LogOut, Menu, X, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  user?: {
    email: string;
    role: string;
    status: string;
    businessName?: string | null;
  } | null;
  cartCount?: number;
}

export function Navbar({ user, cartCount = 0 }: NavbarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">ProCatalogue</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/catalogue" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Catalogue
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Admin Panel
              </Link>
            )}
            {user?.role === "customer" && user?.status === "approved" && (
              <>
                <Link href="/portal/orders" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  My Orders
                </Link>
                <Link href="/portal/inventory" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  Inventory
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {user.role === "customer" && user.status === "approved" && (
                  <Link href="/portal/cart">
                    <Button variant="outline" size="sm" className="relative">
                      <ShoppingCart className="w-4 h-4" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                      Cart
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">{user.businessName || user.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  {user.role === "admin" ? (
                    <Link href="/admin">
                      <Button variant="ghost" size="icon">
                        <LayoutDashboard className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/portal">
                      <Button variant="ghost" size="icon">
                        <User className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
          <Link href="/catalogue" className="block text-gray-700 font-medium py-2" onClick={() => setMobileOpen(false)}>
            Catalogue
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="block text-gray-700 font-medium py-2" onClick={() => setMobileOpen(false)}>
              Admin Panel
            </Link>
          )}
          {user?.role === "customer" && user?.status === "approved" && (
            <>
              <Link href="/portal/cart" className="block text-gray-700 font-medium py-2" onClick={() => setMobileOpen(false)}>
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
              <Link href="/portal/orders" className="block text-gray-700 font-medium py-2" onClick={() => setMobileOpen(false)}>
                My Orders
              </Link>
              <Link href="/portal/inventory" className="block text-gray-700 font-medium py-2" onClick={() => setMobileOpen(false)}>
                Inventory
              </Link>
            </>
          )}
          {user ? (
            <button onClick={handleLogout} className="block w-full text-left text-red-600 font-medium py-2">
              Sign Out
            </button>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Register</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
