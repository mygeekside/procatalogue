import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariants, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    
    const productList = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        isService: products.isService,
        unit: products.unit,
        packSize: products.packSize,
        categoryId: products.categoryId,
        createdAt: products.createdAt,
      })
      .from(products)
      .orderBy(products.name);

    const allCategories = await db.select().from(categories);
    const allVariants = await db.select().from(productVariants);

    const enriched = productList.map(p => ({
      ...p,
      category: allCategories.find(c => c.id === p.categoryId),
      variants: allVariants.filter(v => v.productId === p.id),
    }));

    return NextResponse.json({ products: enriched, categories: allCategories });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await req.json();
    const { name, description, categoryId, imageUrl, isService, unit, packSize, variants } = body;

    if (!name) {
      return NextResponse.json({ error: "Product name required" }, { status: 400 });
    }

    let slug = slugify(name);
    
    // Ensure unique slug
    const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
    if (existing[0]) {
      slug = `${slug}-${Date.now()}`;
    }

    const productResult = await db.insert(products).values({
      name,
      slug,
      description,
      categoryId: categoryId || null,
      imageUrl,
      isService: isService || false,
      unit: unit || "piece",
      packSize,
    }).returning();

    const product = productResult[0];

    // Add variants
    if (variants && variants.length > 0) {
      for (const v of variants) {
        await db.insert(productVariants).values({
          productId: product.id,
          name: v.name || "Standard",
          sku: v.sku || `${slug}-${Date.now()}`,
          price: v.price || 0,
          moq: v.moq || 1,
          stockQty: v.stockQty || 0,
          attributes: v.attributes ? JSON.stringify(v.attributes) : null,
        });
      }
    } else {
      // Default variant
      await db.insert(productVariants).values({
        productId: product.id,
        name: "Standard",
        sku: `${slug}-std`,
        price: 0,
        moq: 1,
        stockQty: 0,
      });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    await db.update(products)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(products.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
