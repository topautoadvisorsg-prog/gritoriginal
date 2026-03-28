import { db } from "./server/db";
import { dataEngineConfig } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const [row] = await db.select()
    .from(dataEngineConfig)
    .where(eq(dataEngineConfig.key, 'DATA_ENGINE_API_KEY'));
  
  if (row) {
    console.log(row.value);
  } else {
    console.log('NOT_FOUND');
  }
  process.exit(0);
}

main();
