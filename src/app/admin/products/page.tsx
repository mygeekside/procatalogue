"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Eye, EyeOff, Package, AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface Variant {
  id: number;
  name: string;
  price: number;
  stockQty: number;
  moq: number;
  isActive: boolean;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isService: boolean;
  unit: string | null;
  categoryId: number | null;
  category?: { name: string } | null;
  variants: Variant[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleActive = async (productId: number, isActive: boolean) => {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, isActive: !isActive }),
    });
    fetchProducts();
  };

  const handleToggleStock = async (variantId: number, currentStock: number) => {
    await fetch("/api/admin/variants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: variantId, stockQty: currentStock > 0 ? 0 : 10 }),
    });
    fetchProducts();
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || 
      (filter === "active" && p.isActive) ||
      (filter === "inactive" && !p.isActive) ||
      (filter === "outofstock" && p.variants.some(v => v.stockQty === 0)) ||
      (filter === "lowstock" && p.variants.some(v => v.stockQty > 0 && v.stockQty < 10));
    return matchSearch && matchFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">{products.length} products total</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {["all", "active", "inactive", "outofstock", "lowstock"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === "outofstock" ? "Out of Stock" : f === "lowstock" ? "Low Stock" : f}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const totalStock = product.variants.reduce((s, v) => s + v.stockQty, 0);
            const minPrice = Math.min(...product.variants.map(v => v.price));
            const hasLowStock = product.variants.some(v => v.stockQty > 0 && v.stockQty < 10);
            const isOutOfStock = !product.isService && totalStock === 0;

            return (
              <Card key={product.id} className={`overflow-hidden ${!product.isActive ? "opacity-60" : ""}`}>
                {/* Image */}
                <div className="relative aspect-square bg-gray-100">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {/* Stock badge */}
                  <div className="absolute top-2 left-2">
                    {product.isService ? (
                      <Badge variant="default">Service</Badge>
                    ) : isOutOfStock ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : hasLowStock ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">In Stock</Badge>
                    )}
                  </div>
                  {!product.isActive && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">Hidden</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-3">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">{product.name}</p>
                  {product.category && (
                    <p className="text-xs text-blue-600 mb-1">{product.category.name}</p>
                  )}
                  <p className="text-sm font-bold text-gray-900 mb-2">
                    {formatCurrency(minPrice)}
                    <span className="text-xs font-normal text-gray-400">/{product.unit || "pc"}</span>
                  </p>
                  
                  {/* Quick actions */}
                  <div className="flex gap-1">
                    <Link href={`/admin/products/${product.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(product.id, product.isActive)}
                      title={product.isActive ? "Hide product" : "Show product"}
                    >
                      {product.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </Button>
                    {!product.isService && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStock(product.variants[0]?.id, totalStock)}
                        title={isOutOfStock ? "Mark in stock" : "Mark out of stock"}
                        className={isOutOfStock ? "text-red-500" : "text-green-500"}
                      >
                        {isOutOfStock ? <AlertTriangle className="w-3 h-3" /> : <ToggleRight className="w-3 h-3" />}
                      </Button>
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
