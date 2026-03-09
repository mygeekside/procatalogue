"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Filter, ShoppingCart, Heart, Lock, Package, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isService: boolean;
  unit: string | null;
  packSize: string | null;
  category?: { id: number; name: string; slug: string } | undefined;
  minPrice: number;
  totalStock: number;
  moq: number;
  inStock: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CatalogueClientProps {
  products: Product[];
  categories: Category[];
  canViewPrices: boolean;
  isLoggedIn: boolean;
  searchQuery: string;
  selectedCategory: string;
}

export function CatalogueClient({
  products,
  categories,
  canViewPrices,
  isLoggedIn,
  searchQuery,
  selectedCategory,
}: CatalogueClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);
  const [isPending, startTransition] = useTransition();
  const [interestedIds, setInterestedIds] = useState<Set<number>>(new Set());

  const handleSearch = (value: string) => {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set("search", value);
      if (selectedCategory) params.set("category", selectedCategory);
      router.push(`/catalogue?${params.toString()}`);
    });
  };

  const handleCategoryFilter = (slug: string) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (slug) params.set("category", slug);
      router.push(`/catalogue?${params.toString()}`);
    });
  };

  const handleInterest = async (productId: number) => {
    const newSet = new Set(interestedIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
      await fetch("/api/products/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    }
    setInterestedIds(newSet);
  };

  const handleAddToCart = async (productId: number) => {
    // Get first variant
    const res = await fetch(`/api/products/${productId}/variants`);
    const data = await res.json();
    if (data.variants?.[0]) {
      await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: data.variants[0].id, quantity: data.variants[0].moq }),
      });
      router.refresh();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Catalogue</h1>
        <p className="text-gray-500">
          {products.length} products available
          {!canViewPrices && (
            <span className="ml-2 text-blue-600 font-medium">
              — <Link href="/register" className="underline">Register</Link> or <Link href="/login" className="underline">login</Link> to view prices & order
            </span>
          )}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryFilter("")}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.slug ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryFilter(cat.slug)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Price visibility banner */}
      {!canViewPrices && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">Prices are hidden for public visitors</p>
            <p className="text-sm text-blue-700">
              <Link href="/register" className="underline font-medium">Register your business</Link> and get approved to view prices and place orders.
            </p>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500">No products found</h3>
          <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                {/* Stock badge */}
                <div className="absolute top-2 left-2">
                  {product.isService ? (
                    <Badge variant="default">Service</Badge>
                  ) : product.inStock ? (
                    <Badge variant="success">In Stock</Badge>
                  ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>
                {/* Interest button */}
                <button
                  onClick={() => handleInterest(product.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                >
                  <Heart
                    className={`w-4 h-4 ${interestedIds.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                  />
                </button>
              </div>

              <CardContent className="p-4">
                {/* Category */}
                {product.category && (
                  <p className="text-xs text-blue-600 font-medium mb-1">{product.category.name}</p>
                )}
                
                {/* Name */}
                <Link href={`/catalogue/${product.slug}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                </Link>

                {/* Description */}
                {product.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                )}

                {/* Pack size */}
                {product.packSize && (
                  <p className="text-xs text-gray-400 mb-2">Pack: {product.packSize}</p>
                )}

                {/* Price & Actions */}
                <div className="flex items-center justify-between mt-auto">
                  {canViewPrices ? (
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(product.minPrice)}
                        <span className="text-xs font-normal text-gray-500">/{product.unit || "pc"}</span>
                      </p>
                      <p className="text-xs text-gray-400">MOQ: {product.moq}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400">
                      <Lock className="w-3 h-3" />
                      <span className="text-sm">Login to view</span>
                    </div>
                  )}

                  {canViewPrices && product.inStock && !product.isService ? (
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product.id)}
                      className="flex-shrink-0"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Add
                    </Button>
                  ) : canViewPrices && product.isService ? (
                    <Link href={`/catalogue/${product.slug}`}>
                      <Button size="sm" variant="outline">Details</Button>
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
