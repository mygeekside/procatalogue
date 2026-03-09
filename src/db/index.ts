import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";
import { mkdirSync } from "fs";

const dataDir = path.join(process.cwd(), "data");
try {
  mkdirSync(dataDir, { recursive: true });
} catch {}

const client = createClient({
  url: `file:${path.join(dataDir, "app.db")}`,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
