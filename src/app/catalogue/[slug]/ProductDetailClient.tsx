"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ShoppingCart, Heart, Lock, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Variant {
  id: number;
  name: string;
  sku: string | null;
  price: number;
  moq: number;
  stockQty: number;
  attributes: string | null;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  images: string | null;
  isService: boolean;
  unit: string | null;
  packSize: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductDetailClientProps {
  product: Product;
  variants: Variant[];
  category: Category | null;
  canViewPrices: boolean;
  isLoggedIn: boolean;
  isApprovedCustomer: boolean;
}

export function ProductDetailClient({
  product,
  variants,
  category,
  canViewPrices,
  isLoggedIn,
  isApprovedCustomer,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [quantity, setQuantity] = useState(variants[0]?.moq || 1);
  const [interested, setInterested] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selectedVariant.id, quantity }),
      });
      if (res.ok) {
        setAddedToCart(true);
        router.refresh();
        setTimeout(() => setAddedToCart(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInterest = async () => {
    setInterested(!interested);
    if (!interested) {
      await fetch("/api/products/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
    }
  };

  const images = product.images ? JSON.parse(product.images) : [];
  const allImages = product.imageUrl ? [product.imageUrl, ...images] : images;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/catalogue" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Catalogue
        </Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/catalogue?category=${category.slug}`} className="hover:text-blue-600">
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4">
            {allImages[0] ? (
              <img src={allImages[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-gray-300" />
              </div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {allImages.slice(1, 5).map((img: string, i: number) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={img} alt={`${product.name} ${i + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {category && (
            <Link href={`/catalogue?category=${category.slug}`}>
              <Badge variant="default" className="mb-3 cursor-pointer">{category.name}</Badge>
            </Link>
          )}
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
          
          {product.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
          )}

          {/* Product details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {product.unit && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Unit</p>
                <p className="font-medium text-gray-900 capitalize">{product.unit}</p>
              </div>
            )}
            {product.packSize && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Pack Size</p>
                <p className="font-medium text-gray-900">{product.packSize}</p>
              </div>
            )}
          </div>

          {/* Variants */}
          {variants.length > 1 && (
            <div className="mb-6">
              <p className="font-medium text-gray-900 mb-3">Select Variant</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v);
                      setQuantity(v.moq);
                    }}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedVariant?.id === v.id
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:border-blue-400"
                    }`}
                  >
                    {v.name}
                    {v.stockQty === 0 && <span className="ml-1 text-red-500">(Out)</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price & Stock */}
          {selectedVariant && (
            <Card className="mb-6">
              <CardContent className="p-4">
                {canViewPrices ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(selectedVariant.price)}
                        <span className="text-base font-normal text-gray-500">/{product.unit || "pc"}</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Minimum order: {selectedVariant.moq} {product.unit || "pc"}</p>
                    </div>
                    <div className="text-right">
                      {product.isService ? (
                        <Badge variant="default">Service</Badge>
                      ) : selectedVariant.stockQty > 0 ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">In Stock</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-500">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-500">
                    <Lock className="w-5 h-5" />
                    <div>
                      <p className="font-medium text-gray-700">Price hidden</p>
                      <p className="text-sm">
                        <Link href="/register" className="text-blue-600 underline">Register</Link> or{" "}
                        <Link href="/login" className="text-blue-600 underline">login</Link> to view pricing
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {isApprovedCustomer && selectedVariant && !product.isService && (
            <div className="space-y-4">
              {/* Quantity */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(selectedVariant.moq, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100 text-gray-600"
                  >
                    −
                  </button>
                  <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 hover:bg-gray-100 text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={loading || selectedVariant.stockQty === 0}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {addedToCart ? "Added!" : "Add to Cart"}
                </Button>
                <Button variant="outline" onClick={handleInterest}>
                  <Heart className={`w-4 h-4 ${interested ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
              </div>
            </div>
          )}

          {!isLoggedIn && (
            <div className="flex gap-3">
              <Link href="/register" className="flex-1">
                <Button className="w-full">Register to Order</Button>
              </Link>
              <Button variant="outline" onClick={handleInterest}>
                <Heart className={`w-4 h-4 ${interested ? "fill-red-500 text-red-500" : ""}`} />
                Interested
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
