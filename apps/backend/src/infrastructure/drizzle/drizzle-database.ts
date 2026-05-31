import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";

import { migrateTodoSchema, todoTable } from "./todo/todo-schema";

export const drizzleSchema = {
  todoTable,
};

export type DrizzleSchema = typeof drizzleSchema;
export type DrizzleDatabase = PgliteDatabase<DrizzleSchema> & {
  $client: PGlite;
};
export type DrizzleTransaction = Parameters<Parameters<DrizzleDatabase["transaction"]>[0]>[0];
export type DrizzleExecutor = DrizzleDatabase | DrizzleTransaction;

export function createDrizzleDatabase(client = new PGlite()): DrizzleDatabase {
  return drizzle(client, {
    schema: drizzleSchema,
  });
}

export async function migrateDrizzleSchema(db: DrizzleDatabase): Promise<void> {
  await migrateTodoSchema(db);
}
