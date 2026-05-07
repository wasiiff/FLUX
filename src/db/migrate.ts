import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const sql = neon(url);
  const db = drizzle(sql);
  console.log("⏳ running migrations…");
  await migrate(db, { migrationsFolder: "src/db/migrations" });
  console.log("✅ migrations done");
}

main().catch((err) => {
  console.error("❌ migration failed", err);
  process.exit(1);
});
