import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { users, orders, productVariants } from "@/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import Link from "next/link";
import { Users, ShoppingBag, Package, AlertTriangle, Clock, FileText, CheckCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminDashboard() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  // Stats
  const pendingRegistrations = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.role, "customer"), eq(users.status, "pending")));

  const pendingOrders = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "pending"));

  const reviewingOrders = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "reviewing"));

  const invoicedOrders = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "invoiced"));

  const outOfStock = await db
    .select({ count: sql<number>`count(*)` })
    .from(productVariants)
    .where(and(eq(productVariants.isActive, true), eq(productVariants.stockQty, 0)));

  const lowStock = await db
    .select({ count: sql<number>`count(*)` })
    .from(productVariants)
    .where(and(eq(productVariants.isActive, true), lt(productVariants.stockQty, 10), sql`${productVariants.stockQty} > 0`));

  // Recent orders
  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      type: orders.type,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      businessName: users.businessName,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .orderBy(sql`${orders.createdAt} DESC`)
    .limit(5);

  // Pending registrations list
  const pendingUsers = await db
    .select({
      id: users.id,
      businessName: users.businessName,
      contactPerson: users.contactPerson,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.role, "customer"), eq(users.status, "pending")))
    .orderBy(sql`${users.createdAt} DESC`)
    .limit(5);

  const statusColors: Record<string, string> = {
    pending: "warning",
    reviewing: "default",
    confirmed: "success",
    invoiced: "default",
    delivered: "success",
    completed: "success",
    cancelled: "destructive",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your business operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/registrations">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Registrations</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{pendingRegistrations[0]?.count || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              {(pendingRegistrations[0]?.count || 0) > 0 && (
                <p className="text-xs text-orange-600 mt-2 font-medium">⚡ Action needed</p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/orders?status=pending">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Orders to Review</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{(pendingOrders[0]?.count || 0) + (reviewingOrders[0]?.count || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{pendingOrders[0]?.count || 0} new, {reviewingOrders[0]?.count || 0} reviewing</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/orders?status=invoiced">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ready for Delivery</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{invoicedOrders[0]?.count || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Invoiced & awaiting delivery</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/products?filter=stock">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Stock Alerts</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{(outOfStock[0]?.count || 0) + (lowStock[0]?.count || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{outOfStock[0]?.count || 0} out, {lowStock[0]?.count || 0} low</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Link href="/admin/products/new">
          <Button className="w-full h-14 text-sm" variant="outline">
            <Package className="w-4 h-4" />
            Add Product
          </Button>
        </Link>
        <Link href="/admin/registrations">
          <Button className="w-full h-14 text-sm" variant="outline">
            <Users className="w-4 h-4" />
            Approve Users
          </Button>
        </Link>
        <Link href="/admin/orders">
          <Button className="w-full h-14 text-sm" variant="outline">
            <ShoppingBag className="w-4 h-4" />
            Manage Orders
          </Button>
        </Link>
        <Link href="/admin/products">
          <Button className="w-full h-14 text-sm" variant="outline">
            <TrendingUp className="w-4 h-4" />
            View Products
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.businessName} · {formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={statusColors[order.status] as "default" | "secondary" | "destructive" | "outline" | "success" | "warning"}>
                          {order.status}
                        </Badge>
                        {order.totalAmount && (
                          <p className="text-xs text-gray-500 mt-1">{formatCurrency(order.totalAmount)}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Registrations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Registrations</CardTitle>
            <Link href="/admin/registrations">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <Link key={user.id} href="/admin/registrations">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{user.businessName}</p>
                        <p className="text-xs text-gray-500">{user.contactPerson} · {user.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="warning">Pending</Badge>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
