"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Image as ImageIcon, Trash2, Copy, CheckCircle, Loader2, FolderOpen, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface UploadedImage {
  filename: string;
  url: string;
  size: number;
}

export default function ImageUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles = Array.from(selectedFiles).filter(f => 
      f.type.startsWith("image/")
    );
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (files.length === 0) return;
    
    setUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/admin/products/images", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setUploadedImages(prev => [...prev, {
            filename: data.filename,
            url: data.url,
            size: file.size,
          }]);
        }
      } catch (error) {
        console.error("Upload error:", error);
      }
    }

    setFiles([]);
    setUploading(false);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteImage = async (filename: string) => {
    await fetch(`/api/admin/products/images?filename=${encodeURIComponent(filename)}`, {
      method: "DELETE",
    });
    setUploadedImages(uploadedImages.filter(img => img.filename !== filename));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Image Management</h1>
          <p className="text-gray-500 text-sm">Upload and manage product images</p>
        </div>
        <Link href="/admin/products/import">
          <Button variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
        </Link>
      </div>

      {/* Instructions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <p className="text-sm text-gray-600">Upload your product images (PNG, JPG, WebP). Files are stored and served from your server.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <p className="text-sm text-gray-600">Copy the image URL and use it in your CSV import (column: image_url).</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <p className="text-sm text-gray-600">Or reference images by filename in CSV: just use the filename (e.g., &quot;product-123.jpg&quot;).</p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">
                Drop images here or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports PNG, JPG, JPEG, WebP (max 10MB each)
              </p>
            </button>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-gray-700">{files.length} file(s) selected</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={uploadImages}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {files.length} Image{files.length > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedImages.map((img) => (
                <div key={img.filename} className="relative group border rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={img.url} 
                    alt={img.filename}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      size="icon" 
                      variant="secondary"
                      onClick={() => copyUrl(img.url)}
                    >
                      {copied === img.url ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="secondary"
                      onClick={() => deleteImage(img.filename)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-xs font-medium text-gray-900 truncate">{img.filename}</p>
                    <p className="text-xs text-gray-500">{formatSize(img.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
