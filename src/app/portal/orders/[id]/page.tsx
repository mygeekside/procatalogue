"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, Package, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  adminQuantity: number | null;
  adminUnitPrice: number | null;
  variantName: string;
  productName: string;
}

interface Order {
  id: number;
  orderNumber: string;
  type: string;
  status: string;
  notes: string | null;
  adminNotes: string | null;
  totalAmount: number | null;
  createdAt: string;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
}

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchOrder = async () => {
    const [orderRes, msgRes] = await Promise.all([
      fetch(`/api/orders/${orderId}`),
      fetch(`/api/orders/${orderId}/message`),
    ]);
    const orderData = await orderRes.json();
    const msgData = await msgRes.json();
    
    if (orderData.order) {
      setOrder(orderData.order);
      setItems(orderData.items || []);
    }
    setMessages(msgData.messages || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    await fetch(`/api/orders/${orderId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });
    setNewMessage("");
    fetchOrder();
    setSending(false);
  };

  const handleConfirmDelivery = async () => {
    setConfirming(true);
    const res = await fetch(`/api/orders/${orderId}/confirm-delivery`, {
      method: "POST",
    });
    if (res.ok) {
      fetchOrder();
      router.refresh();
    }
    setConfirming(false);
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  }

  if (!order) {
    return <div className="text-center py-20 text-gray-400">Order not found</div>;
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

  const total = items.reduce((sum, item) => {
    const qty = item.adminQuantity ?? item.quantity;
    const price = item.adminUnitPrice ?? item.unitPrice;
    return sum + qty * price;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/portal/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
            <Badge variant={statusColors[order.status] || "default"}>{order.status}</Badge>
            <Badge variant="outline">{order.type}</Badge>
          </div>
          <p className="text-gray-500 text-sm">{formatDate(order.createdAt)}</p>
        </div>
        {(order.status === "invoiced" || order.status === "delivered") && (
          <Button
            onClick={handleConfirmDelivery}
            disabled={confirming}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            {confirming ? "Confirming..." : "Confirm Delivery"}
          </Button>
        )}
      </div>

      {/* Status Timeline */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {["pending", "reviewing", "confirmed", "invoiced", "completed"].map((s, i) => {
          const statuses = ["pending", "reviewing", "confirmed", "invoiced", "completed"];
          const currentIdx = statuses.indexOf(order.status);
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          
          return (
            <div key={s} className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                isCompleted ? "bg-green-100 text-green-700" :
                isCurrent ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-400"
              }`}>
                {isCompleted && "✓ "}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
              {i < 4 && <div className={`w-6 h-0.5 ${i < currentIdx ? "bg-green-400" : "bg-gray-200"}`} />}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => {
                  const qty = item.adminQuantity ?? item.quantity;
                  const price = item.adminUnitPrice ?? item.unitPrice;
                  const hasAdminChanges = item.adminQuantity !== null || item.adminUnitPrice !== null;
                  
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">{item.variantName}</p>
                        {hasAdminChanges && (
                          <p className="text-xs text-blue-600 mt-1">* Modified by admin</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{qty} × {formatCurrency(price)}</p>
                        <p className="font-bold text-gray-900">{formatCurrency(qty * price)}</p>
                        {item.adminQuantity !== null && item.adminQuantity !== item.quantity && (
                          <p className="text-xs text-gray-400 line-through">Orig: {item.quantity}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t mt-4 pt-4 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-xl text-gray-900">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Your Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {order.adminNotes && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-700">Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{order.adminNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-80">
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No messages yet. Ask admin about your order here.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">{formatDate(msg.createdAt)}</p>
                      <p className="text-sm text-gray-700">{msg.content}</p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask about your order..."
                  rows={2}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  size="icon"
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
