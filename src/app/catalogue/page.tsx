import { db } from "@/db";
import { products, productVariants, categories } from "@/db/schema";
import { eq, and, like, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { CatalogueClient } from "./CatalogueClient";

interface SearchParams {
  search?: string;
  category?: string;
  page?: string;
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const isApprovedCustomer = session?.role === "customer" && session?.status === "approved";
  const isAdmin = session?.role === "admin";
  const canViewPrices = isApprovedCustomer || isAdmin;

  // Fetch categories
  const allCategories = await db.select().from(categories);

  // Build query
  const conditions = [eq(products.isActive, true)];
  
  if (params.category) {
    const cat = allCategories.find(c => c.slug === params.category);
    if (cat) {
      conditions.push(eq(products.categoryId, cat.id));
    }
  }

  if (params.search) {
    conditions.push(
      or(
        like(products.name, `%${params.search}%`),
        like(products.description, `%${params.search}%`)
      )!
    );
  }

  // Fetch products with their cheapest variant
  const productList = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      imageUrl: products.imageUrl,
      isService: products.isService,
      unit: products.unit,
      packSize: products.packSize,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(products.name);

  // Fetch variants for each product
  const productIds = productList.map(p => p.id);
  
  let variantMap: Record<number, { minPrice: number; totalStock: number; moq: number }> = {};
  
  if (productIds.length > 0) {
    const variants = await db
      .select({
        productId: productVariants.productId,
        price: productVariants.price,
        stockQty: productVariants.stockQty,
        moq: productVariants.moq,
      })
      .from(productVariants)
      .where(eq(productVariants.isActive, true));

    for (const v of variants) {
      if (!variantMap[v.productId]) {
        variantMap[v.productId] = { minPrice: v.price, totalStock: v.stockQty, moq: v.moq };
      } else {
        if (v.price < variantMap[v.productId].minPrice) {
          variantMap[v.productId].minPrice = v.price;
          variantMap[v.productId].moq = v.moq;
        }
        variantMap[v.productId].totalStock += v.stockQty;
      }
    }
  }

  const enrichedProducts = productList.map(p => ({
    ...p,
    category: allCategories.find(c => c.id === p.categoryId),
    minPrice: variantMap[p.id]?.minPrice || 0,
    totalStock: variantMap[p.id]?.totalStock || 0,
    moq: variantMap[p.id]?.moq || 1,
    inStock: (variantMap[p.id]?.totalStock || 0) > 0,
  }));

  return (
    <CatalogueClient
      products={enrichedProducts}
      categories={allCategories}
      canViewPrices={canViewPrices}
      isLoggedIn={!!session}
      searchQuery={params.search || ""}
      selectedCategory={params.category || ""}
    />
  );
}
