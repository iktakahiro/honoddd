/**
 * Base class for domain entities identified by a stable ID.
 *
 * @remarks
 * Equality is based on concrete entity type and identifier, not object
 * reference or mutable state.
 */
export abstract class Entity<TId> {
  protected readonly createdAtValue: Date;
  protected readonly idValue: TId;
  protected updatedAtValue: Date;

  protected constructor(id: TId, createdAt?: Date, updatedAt?: Date) {
    this.idValue = id;
    this.createdAtValue = createdAt ?? new Date();
    this.updatedAtValue = updatedAt ?? new Date();
  }

  get createdAt(): Date {
    return this.createdAtValue;
  }

  get id(): TId {
    return this.idValue;
  }

  get updatedAt(): Date {
    return this.updatedAtValue;
  }

  equals(other: Entity<TId> | null | undefined): boolean {
    if (!other) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return this.constructor === other.constructor && this.idValue === other.idValue;
  }

  protected touch(now = new Date()): void {
    this.updatedAtValue = now;
  }
}
