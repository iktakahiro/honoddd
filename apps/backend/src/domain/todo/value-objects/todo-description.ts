import { ValidationException } from "../../shared";

export class TodoDescription {
  private constructor(readonly value: string) {}

  static create(value: string): TodoDescription {
    const normalized = value.trim();

    if (normalized.length > 1000) {
      throw new ValidationException("Todo description must be 1000 characters or less");
    }

    return new TodoDescription(normalized);
  }
}
