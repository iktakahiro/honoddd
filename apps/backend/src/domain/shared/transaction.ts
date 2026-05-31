export interface TransactionContext {
  rollback(): Promise<void>;
}

export interface TransactionManager {
  runInTransaction<T>(operation: (ctx: TransactionContext) => Promise<T>): Promise<T>;
}
