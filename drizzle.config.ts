import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  // Both schema files must be listed. shared/schema.ts holds domain tables
  // (fighters, events, picks, etc.); shared/models/auth.ts holds users + auth.
  // Missing the second file was the root cause of the prior migration drift.
  schema: ["./shared/schema.ts", "./shared/models/auth.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
