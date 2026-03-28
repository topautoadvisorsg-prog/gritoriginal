const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT value FROM data_engine_config WHERE key = 'DATA_ENGINE_API_KEY'");
    if (res.rows.length > 0) {
      console.log(res.rows[0].value);
    } else {
      console.log('NOT_FOUND');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
