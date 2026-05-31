import { ValidationException } from "../../shared";

export class TodoTitle {
  private constructor(readonly value: string) {}

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
