import { PGlite } from "@electric-sql/pglite";
import { fileURLToPath } from "node:url";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { todoTable } from "./schemas/todo-schema";

const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));

/**
 * Drizzle schema object used by the PGlite database client.
 */
export const drizzleSchema = {
  todoTable,
};

/**
 * Type of the Drizzle schema used by this backend.
 */
export type DrizzleSchema = typeof drizzleSchema;

/**
 * PGlite-backed Drizzle database with access to the underlying client.
 */
export type DrizzleDatabase = PgliteDatabase<DrizzleSchema> & {
  $client: PGlite;
};

/**
 * Drizzle transaction type produced by {@link DrizzleDatabase.transaction}.
 */
export type DrizzleTransaction = Parameters<Parameters<DrizzleDatabase["transaction"]>[0]>[0];

/**
 * Query executor accepted by repository methods.
 */
export type DrizzleExecutor = DrizzleDatabase | DrizzleTransaction;

/**
 * Creates a PGlite client.
 *
 * @param dataDir - Filesystem data directory, or omitted to use `PGLITE_DATA_DIR`.
 *
 * @returns PGlite client instance.
 */
export function createPGliteClient(dataDir = process.env.PGLITE_DATA_DIR ?? "./.pglite"): PGlite {
  return new PGlite(dataDir);
}

/**
 * Creates a Drizzle database bound to the application schema.
 *
 * @param client - Optional PGlite client.
 *
 * @returns Drizzle database instance.
 */
export function createDrizzleDatabase(client = createPGliteClient()): DrizzleDatabase {
  return drizzle(client, {
    schema: drizzleSchema,
  });
}

/**
 * Applies generated Drizzle migrations to the database.
 *
 * @param db - Drizzle database to migrate.
 */
export async function migrateDrizzleSchema(db: DrizzleDatabase): Promise<void> {
  await migrate(db, {
    migrationsFolder,
  });
}
