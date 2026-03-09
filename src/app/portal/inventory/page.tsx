"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, AlertTriangle, Plus, Minus, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface InventoryItem {
  id: number;
  currentQty: number;
  minStockLevel: number | null;
  variantId: number;
  variantName: string;
  productName: string;
  productSlug: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ currentQty: 0, minStockLevel: 0 });

  const fetchInventory = async () => {
    const res = await fetch("/api/inventory");
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValues({ currentQty: item.currentQty, minStockLevel: item.minStockLevel || 0 });
  };

  const saveEdit = async (itemId: number) => {
    await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, ...editValues }),
    });
    setEditingId(null);
    fetchInventory();
  };

  const lowStockCount = items.filter(i => i.minStockLevel && i.currentQty <= i.minStockLevel).length;
  const outOfStockCount = items.filter(i => i.currentQty === 0).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Inventory</h1>
          <p className="text-gray-500 mt-1">Track your stock levels</p>
        </div>
        <Link href="/catalogue">
          <Button>
            <Plus className="w-4 h-4" />
            Order More
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            <p className="text-sm text-gray-500">Total Items</p>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? "border-orange-200" : ""}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-orange-600" : "text-gray-900"}`}>{lowStockCount}</p>
            <p className="text-sm text-gray-500">Low Stock</p>
          </CardContent>
        </Card>
        <Card className={outOfStockCount > 0 ? "border-red-200" : ""}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${outOfStockCount > 0 ? "text-red-600" : "text-gray-900"}`}>{outOfStockCount}</p>
            <p className="text-sm text-gray-500">Out of Stock</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No inventory tracked yet</p>
          <p className="text-gray-400 text-sm mt-1">Your inventory updates automatically after delivery confirmation</p>
          <Link href="/catalogue">
            <Button className="mt-4">Browse Catalogue</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isLow = item.minStockLevel && item.currentQty <= item.minStockLevel && item.currentQty > 0;
            const isOut = item.currentQty === 0;
            const isEditing = editingId === item.id;

            return (
              <Card key={item.id} className={isOut ? "border-red-200" : isLow ? "border-orange-200" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/catalogue/${item.productSlug}`}>
                          <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {item.productName}
                          </p>
                        </Link>
                        {isOut && <Badge variant="destructive">Out of Stock</Badge>}
                        {isLow && !isOut && <Badge variant="warning">Low Stock</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">{item.variantName}</p>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Current Qty</label>
                          <Input
                            type="number"
                            value={editValues.currentQty}
                            onChange={(e) => setEditValues({ ...editValues, currentQty: parseInt(e.target.value) || 0 })}
                            className="w-24 h-8 text-sm"
                            min="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Min Level</label>
                          <Input
                            type="number"
                            value={editValues.minStockLevel}
                            onChange={(e) => setEditValues({ ...editValues, minStockLevel: parseInt(e.target.value) || 0 })}
                            className="w-24 h-8 text-sm"
                            min="0"
                          />
                        </div>
                        <div className="flex gap-1 self-end">
                          <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={() => saveEdit(item.id)}>
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setEditingId(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${isOut ? "text-red-600" : isLow ? "text-orange-600" : "text-gray-900"}`}>
                            {item.currentQty}
                          </p>
                          <p className="text-xs text-gray-400">in stock</p>
                        </div>
                        {item.minStockLevel !== null && item.minStockLevel > 0 && (
                          <div className="text-center">
                            <p className="text-lg font-medium text-gray-400">{item.minStockLevel}</p>
                            <p className="text-xs text-gray-400">minimum</p>
                          </div>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {(isLow || isOut) && (
                          <Link href={`/catalogue/${item.productSlug}`}>
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                              Reorder
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
