import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { requireAdmin } from "@/lib/auth";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "products");

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${random}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Return the URL
    const url = `/uploads/products/${filename}`;
    
    return NextResponse.json({
      success: true,
      filename,
      url,
    });

  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireAdmin();
    
    if (!existsSync(UPLOAD_DIR)) {
      return NextResponse.json({ images: [] });
    }

    const files = await readdir(UPLOAD_DIR);
    const images = files
      .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .map(filename => ({
        filename,
        url: `/uploads/products/${filename}`,
      }));

    return NextResponse.json({ images });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    
    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }

    // Security: prevent path traversal
    if (filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filepath = join(UPLOAD_DIR, filename);
    
    if (existsSync(filepath)) {
      await unlink(filepath);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
