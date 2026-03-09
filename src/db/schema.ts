import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// Users table (customers + admin)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "customer"] }).notNull().default("customer"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  businessName: text("business_name"),
  contactPerson: text("contact_person"),
  address: text("address"),
  deliveryLat: real("delivery_lat"),
  deliveryLng: real("delivery_lng"),
  phone: text("phone"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// Categories
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// Products
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").references(() => categories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  images: text("images"), // JSON array of image URLs
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isService: integer("is_service", { mode: "boolean" }).notNull().default(false),
  packSize: text("pack_size"),
  unit: text("unit").default("piece"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// Product Variants (size, color, make)
export const productVariants = sqliteTable("product_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "A4 White", "Blue", "Large"
  sku: text("sku").unique(),
  price: real("price").notNull().default(0),
  moq: integer("moq").notNull().default(1), // Minimum Order Quantity
  stockQty: integer("stock_qty").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  attributes: text("attributes"), // JSON: { size: "A4", color: "white" }
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// Cart
export const carts = sqliteTable("carts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cartId: integer("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// Orders
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  orderNumber: text("order_number").notNull().unique(),
  type: text("type", { enum: ["quote", "order"] }).notNull().default("order"),
  status: text("status", {
    enum: ["pending", "reviewing", "confirmed", "invoiced", "delivered", "completed", "cancelled"],
  }).notNull().default("pending"),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  totalAmount: real("total_amount").default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  adminQuantity: integer("admin_quantity"), // Admin can override
  adminUnitPrice: real("admin_unit_price"), // Admin can override
  notes: text("notes"),
});

// Messages (chat between customer and admin per order)
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// Invoices
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  totalAmount: real("total_amount").notNull(),
  status: text("status", { enum: ["draft", "sent", "confirmed", "paid"] }).notNull().default("sent"),
  deliveryConfirmedAt: text("delivery_confirmed_at"),
  pdfUrl: text("pdf_url"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// Customer Inventory
export const customerInventory = sqliteTable("customer_inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  currentQty: integer("current_qty").notNull().default(0),
  minStockLevel: integer("min_stock_level").default(0),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// Customer Dues (outstanding amounts)
export const customerDues = sqliteTable("customer_dues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  amount: real("amount").notNull(),
  paidAmount: real("paid_amount").notNull().default(0),
  status: text("status", { enum: ["outstanding", "partial", "paid"] }).notNull().default("outstanding"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// Interested products (leads from public users)
export const productInterests = sqliteTable("product_interests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  email: text("email"),
  sessionId: text("session_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type CustomerInventory = typeof customerInventory.$inferSelect;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
