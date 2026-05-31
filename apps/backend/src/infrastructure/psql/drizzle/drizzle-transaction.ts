import type { TransactionContext, TransactionManager } from "../../../domain/shared";
import {
  createDrizzleDatabase,
  migrateDrizzleSchema,
  type DrizzleDatabase,
  type DrizzleTransaction,
} from "./drizzle-database";

/**
 * Drizzle-backed implementation of {@link TransactionContext}.
 */
export class DrizzleTransactionContext implements TransactionContext {
  constructor(public readonly tx: DrizzleTransaction) {}

  /**
   * {@link TransactionContext.rollback}
   */
  async rollback(): Promise<void> {
    this.tx.rollback();
  }
}

/**
 * Extracts the concrete Drizzle transaction from an application context.
 *
 * @param ctx - Transaction context supplied by a use case.
 *
 * @returns Drizzle transaction bound to the context.
 *
 * @throws {Error} When the context was not created by this infrastructure adapter.
 */
export function getDrizzleTransaction(ctx: TransactionContext): DrizzleTransaction {
  if (ctx instanceof DrizzleTransactionContext) {
    return ctx.tx;
  }

  throw new Error("Unsupported transaction context");
}

/**
 * Drizzle implementation of {@link TransactionManager}.
 */
export class DrizzleTransactionManager implements TransactionManager {
  private readonly ready: Promise<void>;

  constructor(
    private readonly db: DrizzleDatabase = createDrizzleDatabase(),
    ready: Promise<void> = migrateDrizzleSchema(db),
  ) {
    this.ready = ready;
  }

  /**
   * {@link TransactionManager.runInTransaction}
   */
  async runInTransaction<T>(operation: (ctx: TransactionContext) => Promise<T>): Promise<T> {
    await this.ready;

    return this.db.transaction((tx) => operation(new DrizzleTransactionContext(tx)));
  }
}
