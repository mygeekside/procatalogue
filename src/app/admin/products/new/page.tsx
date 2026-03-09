"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Variant {
  name: string;
  sku: string;
  price: number;
  moq: number;
  stockQty: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    imageUrl: "",
    isService: false,
    unit: "piece",
    packSize: "",
  });

  const [variants, setVariants] = useState<Variant[]>([
    { name: "Standard", sku: "", price: 0, moq: 1, stockQty: 0 },
  ]);

  useEffect(() => {
    fetch("/api/admin/products").then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  const addVariant = () => {
    setVariants([...variants, { name: "", sku: "", price: 0, moq: 1, stockQty: 0 }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    setLoading(true);
    
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        variants,
      }),
    });

    if (res.ok) {
      router.push("/admin/products");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-500 text-sm">3 simple steps</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => s < step && setStep(s)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                s < step ? "bg-green-500 text-white cursor-pointer" : 
                s === step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {s < step ? "✓" : s}
            </button>
            <span className={`text-sm ${s === step ? "font-medium text-gray-900" : "text-gray-400"}`}>
              {s === 1 ? "Basic Info" : s === 2 ? "Variants" : "Review & Save"}
            </span>
            {s < 3 && <div className={`w-8 h-0.5 ${s < step ? "bg-green-500" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Product Name *</label>
              <Input
                placeholder="e.g. A4 Copy Paper"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Textarea
                placeholder="Describe the product..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="piece">Piece</option>
                  <option value="ream">Ream</option>
                  <option value="box">Box</option>
                  <option value="litre">Litre</option>
                  <option value="kg">Kilogram</option>
                  <option value="pack">Pack</option>
                  <option value="document">Document</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Pack Size</label>
                <Input
                  placeholder="e.g. 500 sheets, Box of 12"
                  value={form.packSize}
                  onChange={(e) => setForm({ ...form, packSize: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Image URL</label>
                <Input
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isService"
                checked={form.isService}
                onChange={(e) => setForm({ ...form, isService: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isService" className="text-sm font-medium text-gray-700">
                This is a service (not a physical product)
              </label>
            </div>
            <Button
              className="w-full"
              onClick={() => form.name && setStep(2)}
              disabled={!form.name}
            >
              Continue to Variants →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Variants */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Variants (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Add variants for different sizes, colors, or types. If there&apos;s only one version, just fill in the &quot;Standard&quot; variant.
            </p>
            {variants.map((variant, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Variant {index + 1}</h4>
                  {variants.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeVariant(index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Variant Name *</label>
                    <Input
                      placeholder="e.g. Standard, Blue, Large"
                      value={variant.name}
                      onChange={(e) => updateVariant(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">SKU</label>
                    <Input
                      placeholder="e.g. A4-STD-001"
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, "sku", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Price ($) *</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, "price", parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Min. Order Qty</label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={variant.moq}
                      onChange={(e) => updateVariant(index, "moq", parseInt(e.target.value) || 1)}
                      min="1"
                    />
                  </div>
                  {!form.isService && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Stock Quantity</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={variant.stockQty}
                        onChange={(e) => updateVariant(index, "stockQty", parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addVariant} className="w-full">
              <Plus className="w-4 h-4" />
              Add Another Variant
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                Continue to Review →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Review & Save</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-900">{form.name}</h3>
              {form.description && <p className="text-sm text-gray-600">{form.description}</p>}
              <div className="flex gap-4 text-sm text-gray-500">
                {form.unit && <span>Unit: {form.unit}</span>}
                {form.packSize && <span>Pack: {form.packSize}</span>}
                {form.isService && <span className="text-blue-600 font-medium">Service</span>}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Variants ({variants.length})</h4>
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
                    <span className="font-medium">{v.name}</span>
                    <div className="flex gap-4 text-gray-500">
                      <span>${v.price.toFixed(2)}</span>
                      <span>MOQ: {v.moq}</span>
                      {!form.isService && <span>Stock: {v.stockQty}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Saving..." : "✓ Save Product"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
