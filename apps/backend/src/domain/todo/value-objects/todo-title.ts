import { ValidationException } from "../../shared";

/**
 * Validated Todo title value object.
 */
export class TodoTitle {
  private constructor(readonly value: string) {}

  /**
   * Creates a normalized Todo title.
   *
   * @param value - Raw title value.
   *
   * @returns Validated title value object.
   *
   * @throws {ValidationException} When the title is empty or too long.
   */
  static create(value: string): TodoTitle {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new ValidationException("Todo title is required");
    }

    if (normalized.length > 100) {
      throw new ValidationException("Todo title must be 100 characters or less");
    }

    return new TodoTitle(normalized);
  }
}
