import { PGlite } from "@electric-sql/pglite";
import { fileURLToPath } from "node:url";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { todoTable } from "./schemas/todo-schema";

const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));

export const drizzleSchema = {
  todoTable,
};

export type DrizzleSchema = typeof drizzleSchema;
export type DrizzleDatabase = PgliteDatabase<DrizzleSchema> & {
  $client: PGlite;
};
export type DrizzleTransaction = Parameters<Parameters<DrizzleDatabase["transaction"]>[0]>[0];
export type DrizzleExecutor = DrizzleDatabase | DrizzleTransaction;

export function createPGliteClient(dataDir = process.env.PGLITE_DATA_DIR ?? "./.pglite"): PGlite {
  return new PGlite(dataDir);
}

export function createDrizzleDatabase(client = createPGliteClient()): DrizzleDatabase {
  return drizzle(client, {
    schema: drizzleSchema,
  });
}

export async function migrateDrizzleSchema(db: DrizzleDatabase): Promise<void> {
  await migrate(db, {
    migrationsFolder,
  });
}
