import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users, orders, customerInventory, customerDues, productVariants, products } from "@/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import Link from "next/link";
import { ShoppingBag, Package, DollarSign, AlertTriangle, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function CustomerPortalPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }
  
  if (session.status === "pending") {
    redirect("/pending-approval");
  }
  
  if (session.status === "rejected") {
    redirect("/login");
  }

  const user = (await db.select().from(users).where(eq(users.id, session.userId)).limit(1))[0];

  // Recent orders
  const recentOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.userId))
    .orderBy(sql`${orders.createdAt} DESC`)
    .limit(5);

  // Low stock items
  const inventoryItems = await db
    .select({
      id: customerInventory.id,
      currentQty: customerInventory.currentQty,
      minStockLevel: customerInventory.minStockLevel,
      variantName: productVariants.name,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(customerInventory)
    .innerJoin(productVariants, eq(customerInventory.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(customerInventory.userId, session.userId));

  const lowStockItems = inventoryItems.filter(
    item => item.minStockLevel && item.currentQty <= item.minStockLevel
  );

  // Outstanding dues
  const dues = await db
    .select()
    .from(customerDues)
    .where(and(eq(customerDues.userId, session.userId), eq(customerDues.status, "outstanding")));

  const totalDues = dues.reduce((sum, d) => sum + d.amount - d.paidAmount, 0);

  const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
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
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.businessName || user?.contactPerson}!
        </h1>
        <p className="text-gray-500 mt-1">Your procurement dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/portal/orders">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Orders</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {recentOrders.filter(o => !["completed", "cancelled"].includes(o.status)).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/inventory">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Inventory Items</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{inventoryItems.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className={lowStockItems.length > 0 ? "border-orange-200" : ""}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock Alerts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{lowStockItems.length}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockItems.length > 0 ? "bg-orange-100" : "bg-gray-100"}`}>
                <AlertTriangle className={`w-6 h-6 ${lowStockItems.length > 0 ? "text-orange-600" : "text-gray-400"}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={totalDues > 0 ? "border-red-200" : ""}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Outstanding Dues</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalDues)}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${totalDues > 0 ? "bg-red-100" : "bg-gray-100"}`}>
                <DollarSign className={`w-6 h-6 ${totalDues > 0 ? "text-red-600" : "text-gray-400"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <Link href="/catalogue">
          <Button className="w-full h-14" variant="outline">
            <Package className="w-4 h-4" />
            Browse Catalogue
          </Button>
        </Link>
        <Link href="/portal/cart">
          <Button className="w-full h-14" variant="outline">
            <ShoppingBag className="w-4 h-4" />
            View Cart
          </Button>
        </Link>
        <Link href="/portal/orders">
          <Button className="w-full h-14" variant="outline">
            <Clock className="w-4 h-4" />
            My Orders
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/portal/orders">
              <Button variant="ghost" size="sm">View all <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-6">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No orders yet</p>
                <Link href="/catalogue">
                  <Button size="sm" className="mt-3">Browse Catalogue</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link key={order.id} href={`/portal/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={statusColors[order.status] || "default"}>{order.status}</Badge>
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

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Low Stock Alerts</CardTitle>
            <Link href="/portal/inventory">
              <Button variant="ghost" size="sm">Manage <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="text-center py-6">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">All stock levels are good!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.variantName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-600">{item.currentQty} left</p>
                      <p className="text-xs text-gray-400">Min: {item.minStockLevel}</p>
                    </div>
                  </div>
                ))}
                <Link href="/catalogue">
                  <Button size="sm" className="w-full mt-2">Order Refills</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
