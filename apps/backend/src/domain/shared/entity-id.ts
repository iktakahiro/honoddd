import { ValidationException } from "./domain-exception";

export type Brand<T, B extends string> = T & { readonly __brand: B };
export type EntityIdValue = string;
export type EntityId = Brand<EntityIdValue, string>;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const assertUuid = (value: string, label = "ID"): string => {
  if (!uuidPattern.test(value)) {
    throw new ValidationException(`${label} must be a valid UUID`);
  }

  return value;
};

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
