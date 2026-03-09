import { createClient } from "@libsql/client";
import path from "path";
import { mkdirSync } from "fs";
import bcrypt from "bcryptjs";

const dataDir = path.join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

const client = createClient({
  url: `file:${path.join(dataDir, "app.db")}`,
});

async function migrate() {
  // Create all tables
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('admin', 'customer')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      business_name TEXT,
      contact_person TEXT,
      address TEXT,
      delivery_lat REAL,
      delivery_lng REAL,
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      image_url TEXT,
      images TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_service INTEGER NOT NULL DEFAULT 0,
      pack_size TEXT,
      unit TEXT DEFAULT 'piece',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      price REAL NOT NULL DEFAULT 0,
      moq INTEGER NOT NULL DEFAULT 1,
      stock_qty INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      attributes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
      variant_id INTEGER NOT NULL REFERENCES product_variants(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      order_number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'order' CHECK(type IN ('quote', 'order')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'confirmed', 'invoiced', 'delivered', 'completed', 'cancelled')),
      notes TEXT,
      admin_notes TEXT,
      total_amount REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      variant_id INTEGER NOT NULL REFERENCES product_variants(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      admin_quantity INTEGER,
      admin_unit_price REAL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      invoice_number TEXT NOT NULL UNIQUE,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('draft', 'sent', 'confirmed', 'paid')),
      delivery_confirmed_at TEXT,
      pdf_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customer_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      variant_id INTEGER NOT NULL REFERENCES product_variants(id),
      current_qty INTEGER NOT NULL DEFAULT 0,
      min_stock_level INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customer_dues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      invoice_id INTEGER NOT NULL REFERENCES invoices(id),
      amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'outstanding' CHECK(status IN ('outstanding', 'partial', 'paid')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_interests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      email TEXT,
      session_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log("✅ Tables created");

  // Seed admin user
  const adminEmail = "admin@example.com";
  const existing = await client.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [adminEmail],
  });
  
  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash("admin123", 10);
    await client.execute({
      sql: "INSERT INTO users (email, password_hash, role, status, business_name, contact_person) VALUES (?, ?, 'admin', 'approved', 'Admin', 'Administrator')",
      args: [adminEmail, hash],
    });
    console.log("✅ Admin user created: admin@example.com / admin123");
  }

  // Seed categories
  const cats = [
    { name: "Office Supplies", slug: "office-supplies", description: "Pens, notebooks, folders and more" },
    { name: "Cleaning Materials", slug: "cleaning-materials", description: "Cleaning products and supplies" },
    { name: "Paper & Stationery", slug: "paper-stationery", description: "Papers, envelopes, and stationery" },
    { name: "Printing Services", slug: "printing-services", description: "Printing, binding, and finishing" },
  ];
  
  for (const cat of cats) {
    const existingCat = await client.execute({
      sql: "SELECT id FROM categories WHERE slug = ?",
      args: [cat.slug],
    });
    if (existingCat.rows.length === 0) {
      await client.execute({
        sql: "INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)",
        args: [cat.name, cat.slug, cat.description],
      });
    }
  }
  console.log("✅ Categories seeded");

  // Seed sample products
  const sampleProducts = [
    { name: "A4 Copy Paper", slug: "a4-copy-paper", categorySlug: "paper-stationery", description: "High quality A4 copy paper, 80gsm", unit: "ream", packSize: "500 sheets", price: 8.99, stock: 500 },
    { name: "Ballpoint Pen (Blue)", slug: "ballpoint-pen-blue", categorySlug: "office-supplies", description: "Smooth writing ballpoint pen, blue ink", unit: "piece", packSize: "Box of 12", price: 0.75, stock: 1000 },
    { name: "Ballpoint Pen (Black)", slug: "ballpoint-pen-black", categorySlug: "office-supplies", description: "Smooth writing ballpoint pen, black ink", unit: "piece", packSize: "Box of 12", price: 0.75, stock: 800 },
    { name: "Stapler", slug: "stapler", categorySlug: "office-supplies", description: "Heavy duty stapler, 26/6 staples", unit: "piece", price: 12.50, stock: 50 },
    { name: "A4 Notebook", slug: "a4-notebook", categorySlug: "office-supplies", description: "A4 ruled notebook, 200 pages", unit: "piece", price: 3.99, stock: 200 },
    { name: "Floor Cleaner", slug: "floor-cleaner", categorySlug: "cleaning-materials", description: "Multi-surface floor cleaner, lemon scent", unit: "litre", packSize: "5L", price: 15.99, stock: 100 },
    { name: "Hand Sanitizer", slug: "hand-sanitizer", categorySlug: "cleaning-materials", description: "70% alcohol hand sanitizer", unit: "bottle", packSize: "500ml", price: 4.99, stock: 300 },
    { name: "Toilet Paper", slug: "toilet-paper", categorySlug: "cleaning-materials", description: "2-ply toilet paper rolls", unit: "roll", packSize: "Pack of 24", price: 18.99, stock: 150 },
    { name: "Document Binding", slug: "document-binding", categorySlug: "printing-services", description: "Professional document binding service", unit: "document", isService: true, price: 5.00, stock: 0 },
    { name: "Business Card Printing", slug: "business-card-printing", categorySlug: "printing-services", description: "Full color business card printing", unit: "pack", packSize: "100 cards", isService: true, price: 25.00, stock: 0 },
    { name: "Printer Paper A3", slug: "printer-paper-a3", categorySlug: "paper-stationery", description: "A3 printer paper, 80gsm", unit: "ream", packSize: "250 sheets", price: 12.99, stock: 200 },
    { name: "Sticky Notes", slug: "sticky-notes", categorySlug: "office-supplies", description: "Colorful sticky notes 75x75mm", unit: "pack", packSize: "Pack of 5 x 100", price: 5.49, stock: 400 },
  ];

  for (const p of sampleProducts) {
    const existingProd = await client.execute({
      sql: "SELECT id FROM products WHERE slug = ?",
      args: [p.slug],
    });
    
    if (existingProd.rows.length === 0) {
      const catResult = await client.execute({
        sql: "SELECT id FROM categories WHERE slug = ?",
        args: [p.categorySlug],
      });
      const catId = catResult.rows[0]?.id || null;
      
      const prodResult = await client.execute({
        sql: "INSERT INTO products (category_id, name, slug, description, unit, pack_size, is_service) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
        args: [catId, p.name, p.slug, p.description, p.unit, p.packSize || null, p.isService ? 1 : 0],
      });
      
      const productId = prodResult.rows[0]?.id;
      
      await client.execute({
        sql: "INSERT INTO product_variants (product_id, name, sku, price, moq, stock_qty) VALUES (?, 'Standard', ?, ?, 1, ?)",
        args: [productId, `${p.slug}-std`, p.price, p.stock],
      });
    }
  }
  console.log("✅ Sample products seeded");
  console.log("✅ Database migration complete!");
}

migrate().catch(console.error);
