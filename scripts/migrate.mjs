// Applies db/schema.sql (idempotent). Runs on every container start.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("[migrate] DATABASE_URL is not set");
  process.exit(1);
}

const schemaPath = fileURLToPath(new URL("../db/schema.sql", import.meta.url));
const sql = await readFile(schemaPath, "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query(sql);
  console.log("[migrate] schema is up to date");
} catch (err) {
  console.error("[migrate] failed:", err.message || err.code || err);
  process.exitCode = 1;
} finally {
  await client.end();
}
