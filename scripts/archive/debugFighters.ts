
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL must be set");
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();
    try {
        console.log("🔍 Inspecting 'fighters' Table Columns...");
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'fighters'
            ORDER BY column_name;
        `);
        console.table(res.rows);
    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
