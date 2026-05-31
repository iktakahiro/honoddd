/**
 * Context for database operations executed inside an application transaction.
 *
 * @remarks
 * The domain and application layers only depend on this infrastructure-agnostic
 * contract. Concrete adapters may wrap Drizzle, SQL clients, or other
 * transaction implementations behind it.
 */
export interface TransactionContext {
  /**
   * Rolls back the active transaction.
   */
  rollback(): Promise<void>;
}

/**
 * Executes application operations within explicit transaction boundaries.
 */
export interface TransactionManager {
  /**
   * Runs the operation inside a transaction.
   *
   * @param operation - Application operation that receives a transaction context.
   *
   * @returns The operation result after the transaction commits.
   */
  runInTransaction<T>(operation: (ctx: TransactionContext) => Promise<T>): Promise<T>;
}
