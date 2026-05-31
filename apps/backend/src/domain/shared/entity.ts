export abstract class Entity<TId> {
  protected readonly _createdAt: Date;
  protected readonly _id: TId;
  protected _updatedAt: Date;

  protected constructor(id: TId, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? new Date();
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get id(): TId {
    return this._id;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  equals(other: Entity<TId> | null | undefined): boolean {
    if (!other) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return this.constructor === other.constructor && this._id === other._id;
  }

  protected touch(now = new Date()): void {
    this._updatedAt = now;
  }
}
