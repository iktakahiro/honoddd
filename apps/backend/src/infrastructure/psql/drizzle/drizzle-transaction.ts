import type { TransactionContext, TransactionManager } from "../../../domain/shared";
import {
  createDrizzleDatabase,
  migrateDrizzleSchema,
  type DrizzleDatabase,
  type DrizzleTransaction,
} from "./drizzle-database";

export class DrizzleTransactionContext implements TransactionContext {
  constructor(public readonly tx: DrizzleTransaction) {}

  async rollback(): Promise<void> {
    this.tx.rollback();
  }
}

export function getDrizzleTransaction(ctx: TransactionContext): DrizzleTransaction {
  if (ctx instanceof DrizzleTransactionContext) {
    return ctx.tx;
  }

  throw new Error("Unsupported transaction context");
}

export class DrizzleTransactionManager implements TransactionManager {
  private readonly ready: Promise<void>;

  constructor(
    private readonly db: DrizzleDatabase = createDrizzleDatabase(),
    ready: Promise<void> = migrateDrizzleSchema(db),
  ) {
    this.ready = ready;
  }

  async runInTransaction<T>(operation: (ctx: TransactionContext) => Promise<T>): Promise<T> {
    await this.ready;

    return this.db.transaction((tx) => operation(new DrizzleTransactionContext(tx)));
  }
}
