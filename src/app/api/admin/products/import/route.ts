import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariants, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
      return NextResponse.json({ 
        success: false, 
        productsCreated: 0, 
        variantsCreated: 0, 
        errors: ["CSV file is empty or has no data rows"] 
      }, { status: 400 });
    }

    // Parse header
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
    
    // Map column indices
    const colIndex: Record<string, number> = {};
    headers.forEach((h, i) => {
      colIndex[h] = i;
    });

    // Validate required columns
    if (colIndex["product_name"] === undefined || colIndex["variant_name"] === undefined || colIndex["price"] === undefined) {
      return NextResponse.json({ 
        success: false, 
        productsCreated: 0, 
        variantsCreated: 0, 
        errors: ["Missing required columns: product_name, variant_name, price"] 
      }, { status: 400 });
    }

    const errors: string[] = [];
    const productsMap = new Map<string, number>(); // product name -> product id
    const categoryCache = new Map<string, number>(); // category name -> category id
    
    let productsCreated = 0;
    let variantsCreated = 0;

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        // Simple CSV parsing (handles basic cases)
        const values = parseCSVLine(lines[i]);
        
        const productName = values[colIndex["product_name"]]?.trim();
        const variantName = values[colIndex["variant_name"]]?.trim();
        const price = parseFloat(values[colIndex["price"]] || "0");
        
        if (!productName || !variantName || isNaN(price)) {
          errors.push(`Row ${i + 1}: Missing required fields (product_name, variant_name, or price)`);
          continue;
        }

        // Get or create category
        let categoryId: number | null = null;
        const categoryName = values[colIndex["category_name"]]?.trim();
        if (categoryName) {
          if (categoryCache.has(categoryName)) {
            categoryId = categoryCache.get(categoryName)!;
          } else {
            // Check if category exists
            const existingCat = await db.select().from(categories).where(eq(categories.name, categoryName)).limit(1);
            if (existingCat[0]) {
              categoryId = existingCat[0].id;
              categoryCache.set(categoryName, categoryId);
            } else {
              // Create category
              const catSlug = slugify(categoryName);
              const newCat = await db.insert(categories).values({
                name: categoryName,
                slug: catSlug,
              }).returning();
              categoryId = newCat[0].id;
              categoryCache.set(categoryName, categoryId);
            }
          }
        }

        // Get or create product
        let productId: number;
        if (productsMap.has(productName)) {
          productId = productsMap.get(productName)!;
        } else {
          // Create product
          const slug = slugify(productName);
          let finalSlug = slug;
          
          // Ensure unique slug
          const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, finalSlug)).limit(1);
          if (existing[0]) {
            finalSlug = `${slug}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          }

          const productData = {
            name: productName,
            slug: finalSlug,
            description: values[colIndex["product_description"]]?.trim() || null,
            categoryId,
            imageUrl: values[colIndex["image_url"]]?.trim() || null,
            isService: values[colIndex["is_service"]]?.trim().toLowerCase() === "true",
            unit: values[colIndex["unit"]]?.trim() || "piece",
            packSize: values[colIndex["pack_size"]]?.trim() || null,
          };

          const newProduct = await db.insert(products).values(productData).returning();
          productId = newProduct[0].id;
          productsMap.set(productName, productId);
          productsCreated++;
        }

        // Create variant
        const sku = values[colIndex["sku"]]?.trim() || `${slugify(productName)}-${slugify(variantName)}-${Date.now()}`;
        const moq = parseInt(values[colIndex["moq"]] || "1") || 1;
        const stockQty = parseInt(values[colIndex["stock_qty"]] || "0") || 0;

        await db.insert(productVariants).values({
          productId,
          name: variantName,
          sku,
          price,
          moq,
          stockQty,
        });
        variantsCreated++;

      } catch (rowError: any) {
        errors.push(`Row ${i + 1}: ${rowError.message || "Unknown error"}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      productsCreated,
      variantsCreated,
      errors: errors.slice(0, 20), // Limit errors to 20
    });

  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ 
      success: false,
      productsCreated: 0, 
      variantsCreated: 0, 
      errors: [error.message || "Internal server error"] 
    }, { status: 500 });
  }
}

// Simple CSV line parser that handles quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}
