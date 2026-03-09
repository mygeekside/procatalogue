import { db } from "@/db";
import { products, productVariants, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "./ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  const canViewPrices = (session?.role === "customer" && session?.status === "approved") || session?.role === "admin";

  const productResult = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  if (!productResult[0]) {
    notFound();
  }

  const product = productResult[0];

  const variants = await db
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.productId, product.id), eq(productVariants.isActive, true)));

  const category = product.categoryId
    ? (await db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1))[0]
    : null;

  return (
    <ProductDetailClient
      product={product}
      variants={variants}
      category={category}
      canViewPrices={canViewPrices}
      isLoggedIn={!!session}
      isApprovedCustomer={session?.role === "customer" && session?.status === "approved"}
    />
  );
}
