"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, FileText, CheckCircle, Package, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderItem {
  id: number;
  variantId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  adminQuantity: number | null;
  adminUnitPrice: number | null;
  notes: string | null;
  variantName?: string;
  productName?: string;
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
  businessName: string | null;
  contactPerson: string | null;
  email: string;
  deliveryCode: string | null;
  deliveryCodeGeneratedAt: string | null;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deliveryCode, setDeliveryCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchOrder = async () => {
    const [orderRes, msgRes] = await Promise.all([
      fetch(`/api/admin/orders/${orderId}`),
      fetch(`/api/orders/${orderId}/message`),
    ]);
    const orderData = await orderRes.json();
    const msgData = await msgRes.json();
    
    if (orderData.order) {
      setOrder(orderData.order);
      setItems(orderData.items || []);
      setAdminNotes(orderData.order.adminNotes || "");
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

  const handleUpdateStatus = async (status: string) => {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: parseInt(orderId), status, adminNotes }),
    });
    fetchOrder();
  };

  const handleGenerateInvoice = async () => {
    setGenerating(true);
    const res = await fetch(`/api/admin/orders/${orderId}/invoice`, {
      method: "POST",
    });
    if (res.ok) {
      fetchOrder();
    }
    setGenerating(false);
  };

  const handleItemUpdate = (itemId: number, field: string, value: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: parseFloat(value) || 0 } : item
    ));
  };

  const handleSaveItems = async () => {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: parseInt(orderId), items, adminNotes }),
    });
    fetchOrder();
  };

  const handleVerifyDelivery = async () => {
    if (!deliveryCode.trim()) {
      setCodeError("Please enter the delivery code");
      return;
    }
    setVerifyingCode(true);
    setCodeError("");
    
    const res = await fetch(`/api/admin/orders/${orderId}/verify-delivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryCode }),
    });
    
    if (res.ok) {
      fetchOrder();
      setDeliveryCode("");
    } else {
      const data = await res.json();
      setCodeError(data.error || "Invalid delivery code");
    }
    setVerifyingCode(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/orders">
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
          <p className="text-gray-500 text-sm">{order.businessName} · {order.contactPerson} · {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          {order.status === "pending" && (
            <Button onClick={() => handleUpdateStatus("reviewing")} variant="outline">
              Start Review
            </Button>
          )}
          {(order.status === "reviewing" || order.status === "confirmed") && (
            <Button
              onClick={handleGenerateInvoice}
              disabled={generating}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileText className="w-4 h-4" />
              {generating ? "Generating..." : "Generate Invoice"}
            </Button>
          )}
          {order.status === "invoiced" && (
            <div className="space-y-4">
              {!order.deliveryCode ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-800 text-sm">
                    Waiting for customer to generate delivery code...
                  </p>
                  <p className="text-yellow-600 text-xs mt-1">
                    Customer must generate a code from their dashboard before delivery can be confirmed.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm mb-3 text-center font-medium">
                    Customer has generated a delivery code. Enter it below to confirm delivery:
                  </p>
                  <div className="flex gap-2 max-w-md mx-auto">
                    <Input
                      value={deliveryCode}
                      onChange={(e) => {
                        setDeliveryCode(e.target.value.toUpperCase());
                        setCodeError("");
                      }}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="text-center text-lg tracking-widest font-mono uppercase"
                    />
                    <Button
                      onClick={handleVerifyDelivery}
                      disabled={verifyingCode || deliveryCode.length !== 6}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {verifyingCode ? "Verifying..." : "Verify & Confirm"}
                    </Button>
                  </div>
                  {codeError && (
                    <p className="text-red-600 text-sm mt-2 text-center">{codeError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
                <span className="text-sm font-normal text-gray-500 ml-auto">
                  You can edit quantities and prices below
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="text-left py-2 pr-4">Product</th>
                      <th className="text-center py-2 px-2">Orig. Qty</th>
                      <th className="text-center py-2 px-2">Admin Qty</th>
                      <th className="text-center py-2 px-2">Unit Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-gray-900">{item.productName || `Variant #${item.variantId}`}</p>
                          <p className="text-xs text-gray-400">{item.variantName}</p>
                        </td>
                        <td className="text-center py-3 px-2 text-gray-500">{item.quantity}</td>
                        <td className="text-center py-3 px-2">
                          <Input
                            type="number"
                            value={item.adminQuantity ?? item.quantity}
                            onChange={(e) => handleItemUpdate(item.id, "adminQuantity", e.target.value)}
                            className="w-20 text-center h-8 text-sm"
                            min="0"
                          />
                        </td>
                        <td className="text-center py-3 px-2">
                          <Input
                            type="number"
                            value={item.adminUnitPrice ?? item.unitPrice}
                            onChange={(e) => handleItemUpdate(item.id, "adminUnitPrice", e.target.value)}
                            className="w-24 text-center h-8 text-sm"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="text-right py-3 font-medium">
                          {formatCurrency((item.adminQuantity ?? item.quantity) * (item.adminUnitPrice ?? item.unitPrice))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2">
                      <td colSpan={4} className="py-3 font-bold text-right pr-4">Total:</td>
                      <td className="py-3 font-bold text-right text-lg">{formatCurrency(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-4 flex gap-3">
                <Button onClick={handleSaveItems} variant="outline" size="sm">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about this order..."
                rows={3}
              />
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                onClick={() => handleUpdateStatus(order.status)}
              >
                Save Notes
              </Button>
            </CardContent>
          </Card>
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
                  <p className="text-gray-400 text-sm text-center py-4">No messages yet</p>
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
                  placeholder="Type a message..."
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
