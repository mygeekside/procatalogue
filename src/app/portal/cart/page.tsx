"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

interface CartItem {
  id: number;
  quantity: number;
  variantId: number;
  variantName: string;
  productName: string;
  productSlug: string;
  price: number;
  moq: number;
  stockQty: number;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderType, setOrderType] = useState<"order" | "quote">("order");

  const fetchCart = async () => {
    const res = await fetch("/api/cart");
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (itemId: number, quantity: number) => {
    await fetch("/api/cart/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity }),
    });
    fetchCart();
    router.refresh();
  };

  const removeItem = async (itemId: number) => {
    await fetch("/api/cart/update", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    fetchCart();
    router.refresh();
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: orderType, notes }),
    });
    
    if (res.ok) {
      const data = await res.json();
      router.push(`/portal/orders/${data.orderId}`);
      router.refresh();
    }
    setSubmitting(false);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading cart...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">Your cart is empty</h3>
          <p className="text-gray-400 mb-6">Browse our catalogue to add items</p>
          <Link href="/catalogue">
            <Button>
              Browse Catalogue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/catalogue/${item.productSlug}`}>
                        <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {item.productName}
                        </p>
                      </Link>
                      <p className="text-sm text-gray-500">{item.variantName}</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(item.moq, item.quantity - 1))}
                        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{items.length} item(s)</span>
                  <span className="font-bold text-lg">{formatCurrency(total)}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Order Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOrderType("order")}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        orderType === "order" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-700"
                      }`}
                    >
                      Place Order
                    </button>
                    <button
                      onClick={() => setOrderType("quote")}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        orderType === "quote" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-700"
                      }`}
                    >
                      Request Quote
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                  <Textarea
                    placeholder="Any special instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : orderType === "quote" ? "Request Quote" : "Place Order"}
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Link href="/catalogue">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
