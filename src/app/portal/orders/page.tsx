"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Order {
  id: number;
  orderNumber: string;
  type: string;
  status: string;
  totalAmount: number | null;
  createdAt: string;
  notes: string | null;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  pending: "warning",
  reviewing: "default",
  confirmed: "success",
  invoiced: "default",
  delivered: "success",
  completed: "success",
  cancelled: "destructive",
};

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/orders")
      .then(r => r.json())
      .then(d => {
        setOrders(d.orders || []);
        setLoading(false);
      });
  }, []);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1">Track all your orders</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "pending", "reviewing", "confirmed", "invoiced", "completed"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No orders found</p>
          <Link href="/catalogue">
            <Button className="mt-4">Browse Catalogue</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{order.orderNumber}</p>
                        <Badge variant={statusColors[order.status] || "default"}>{order.status}</Badge>
                        <Badge variant="outline" className="text-xs">{order.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.totalAmount && (
                      <p className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                    )}
                    <Link href={`/portal/orders/${order.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                    {order.status === "invoiced" && (
                      <Link href={`/portal/orders/${order.id}`}>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Confirm Delivery
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
