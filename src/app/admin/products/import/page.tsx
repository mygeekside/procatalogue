"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ImportResult {
  success: boolean;
  productsCreated: number;
  variantsCreated: number;
  errors: string[];
}

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert("Please select a CSV file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        productsCreated: 0,
        variantsCreated: 0,
        errors: ["Failed to import. Please try again."],
      });
    }

    setImporting(false);
  };

  const downloadTemplate = () => {
    const template = `category_name,product_name,product_description,unit,pack_size,is_service,image_url,variant_name,sku,price,moq,stock_qty
Office Supplies,A4 Copy Paper,80gsm bright white copy paper,ream,500 sheets,false,https://example.com/a4-paper.jpg,Standard,A4-STD-001,5.99,1,1000
Office Supplies,A4 Copy Paper,80gsm bright white copy paper,ream,500 sheets,false,,Premium,A4-PREM-002,7.99,1,500
Office Supplies,Ballpoint Pen Blue,Medium point ballpoint pen,piece,Box of 50,false,https://example.com/pen.jpg,Standard,PEN-BLUE-001,12.50,1,2000
Cleaning,Disinfectant Spray,500ml antibacterial spray,piece,1 bottle,false,,Lemon,Lemon-500,3.99,6,300
Cleaning,Disinfectant Spray,500ml antibacterial spray,piece,1 bottle,false,,Fresh,Fresh-500,3.99,6,300
Office Supplies,Sticky Notes Yellow,3x3 inch sticky notes,pack,12 pads,false,,Yellow Pack,STICKY-Y-001,4.50,2,800`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import Products</h1>
          <p className="text-gray-500 text-sm">Import thousands of products via CSV</p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <p className="font-medium text-gray-900">Download the template</p>
              <p className="text-sm text-gray-500">Click the download button below to get a sample CSV file with the correct format.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <p className="font-medium text-gray-900">Fill in your product data</p>
              <p className="text-sm text-gray-500">Add your products, variants, SKUs, prices, and stock quantities. Use the same category_name to group variants under one product.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div>
              <p className="font-medium text-gray-900">Upload and import</p>
              <p className="text-sm text-gray-500">Upload your CSV file and click Import. For 10,000+ products, this may take a few minutes.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
            <div>
              <p className="font-medium text-gray-900">Images</p>
              <p className="text-sm text-gray-500">Use external image URLs in the CSV, or upload images separately and reference them by filename.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Template */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="w-4 h-4" />
            Download CSV Template
          </Button>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? "border-blue-500 bg-blue-50" 
                : file 
                  ? "border-green-500 bg-green-50" 
                  : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="w-10 h-10 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setFile(null); setResult(null); }}
                  className="ml-4"
                >
                  Change
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports CSV files with up to 50,000 rows
                </p>
              </button>
            )}
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Products
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <div className={`rounded-lg p-4 ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              {result.success ? (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">
                      Import Successful!
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Created {result.productsCreated} products with {result.variantsCreated} variants.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">
                      Import Failed
                    </p>
                    <ul className="text-sm text-red-700 mt-1 space-y-1">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>• ...and {result.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Format Help */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">CSV Column Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-gray-700">Column</th>
                  <th className="text-left py-2 font-medium text-gray-700">Required</th>
                  <th className="text-left py-2 font-medium text-gray-700">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">category_name</td>
                  <td className="py-2">No</td>
                  <td>Category name (will be created if doesn&apos;t exist)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">product_name</td>
                  <td className="py-2 text-red-600">Yes</td>
                  <td>Name of the product</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">product_description</td>
                  <td className="py-2">No</td>
                  <td>Product description</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">unit</td>
                  <td className="py-2">No</td>
                  <td>piece, ream, box, litre, kg, pack (default: piece)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">pack_size</td>
                  <td className="py-2">No</td>
                  <td>e.g. &quot;500 sheets&quot;, &quot;Box of 12&quot;</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">is_service</td>
                  <td className="py-2">No</td>
                  <td>true/false (default: false)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">image_url</td>
                  <td className="py-2">No</td>
                  <td>Full URL to product image</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">variant_name</td>
                  <td className="py-2 text-red-600">Yes</td>
                  <td>Variant name (e.g. &quot;Standard&quot;, &quot;Blue&quot;, &quot;Large&quot;)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">sku</td>
                  <td className="py-2">No</td>
                  <td>Unique SKU code for the variant</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">price</td>
                  <td className="py-2 text-red-600">Yes</td>
                  <td>Price in dollars</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">moq</td>
                  <td className="py-2">No</td>
                  <td>Minimum order quantity (default: 1)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">stock_qty</td>
                  <td className="py-2">No</td>
                  <td>Stock quantity (default: 0)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
