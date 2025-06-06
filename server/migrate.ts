import { db } from "./db";
import { readFileSync } from "fs";
import { join } from "path";
import { glob } from "glob";

async function runMigrations() {
  try {
    // Get all migration files
    const migrationFiles = await glob("server/migrations/*.sql");
    migrationFiles.sort(); // Ensure migrations run in order

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sql = readFileSync(file, "utf-8");
      await db.execute(sql);
      console.log(`✅ Completed migration: ${file}`);
    }

    console.log("All migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigrations(); 