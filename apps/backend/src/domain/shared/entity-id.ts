import { ValidationException } from "./domain-exception";

/**
 * Nominal type marker for values that must not be mixed accidentally.
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/**
 * Primitive value used by entity identifiers.
 */
export type EntityIdValue = string;

/**
 * Base branded identifier type for entities.
 */
export type EntityId = Brand<EntityIdValue, string>;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

/**
 * Asserts that a string is a valid UUID.
 *
 * @param value - Candidate UUID string.
 * @param label - Human-readable value label used in validation errors.
 *
 * @returns The original UUID string.
 *
 * @throws {ValidationException} When the value is not a UUID.
 */
export const assertUuid = (value: string, label = "ID"): string => {
  if (!uuidPattern.test(value)) {
    throw new ValidationException(`${label} must be a valid UUID`);
  }

  return value;
};

/**
 * Creates a small value-object helper for branded UUID identifiers.
 *
 * @remarks
 * The returned helper centralizes parsing, generation, and type guarding for
 * single-value entity IDs.
 *
 * @param label - Brand label and validation message label.
 *
 * @returns Identifier helper functions for the requested brand.
 */
export const makeIdVO = <B extends string>(label: B) => {
  type Id = Brand<EntityIdValue, B>;

  return {
    generate(): Id {
      return assertUuid(crypto.randomUUID(), label) as Id;
    },
    is(input: unknown): input is Id {
      return this.safeParse(input).success;
    },
    parse(input: unknown): Id {
      if (typeof input !== "string") {
        throw new ValidationException(`${label} must be a string`);
      }

      return assertUuid(input, label) as Id;
    },
    safeParse(input: unknown): { success: true; value: Id } | { success: false } {
      try {
        return {
          success: true,
          value: this.parse(input),
        };
      } catch {
        return {
          success: false,
        };
      }
    },
  } as const;
};
