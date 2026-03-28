import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import { env } from "./config/env";

const { Pool } = pg;

export const pool = new Pool({ 
  connectionString: env.DATABASE_URL,
  max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS, 10) : 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased slightly for resilience during spikes
});
export const db = drizzle(pool, { schema });
