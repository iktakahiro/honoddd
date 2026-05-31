import { ValidationException } from "../../shared";

/**
 * Validated Todo description value object.
 */
export class TodoDescription {
  private constructor(readonly value: string) {}

  /**
   * Creates a normalized Todo description.
   *
   * @param value - Raw description value.
   *
   * @returns Validated description value object.
   *
   * @throws {ValidationException} When the description is too long.
   */
  static create(value: string): TodoDescription {
    const normalized = value.trim();

    if (normalized.length > 1000) {
      throw new ValidationException("Todo description must be 1000 characters or less");
    }

    return new TodoDescription(normalized);
  }
}
