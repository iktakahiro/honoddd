import { describe, expect, it } from "bun:test";

import { ValidationException } from "../../shared";
import { TodoDescription } from "./todo-description";
import { TodoId } from "./todo-id";
import { TodoTitle } from "./todo-title";

describe("Todo value objects", () => {
  it("parses valid Todo IDs", () => {
    const id = TodoId.parse("11111111-1111-4111-8111-111111111111");

    expect(id).toBe(TodoId.parse("11111111-1111-4111-8111-111111111111"));
    expect(TodoId.is(id)).toBe(true);
  });

  it("rejects invalid Todo IDs", () => {
    expect(() => TodoId.parse("not-a-uuid")).toThrow(ValidationException);
    expect(TodoId.safeParse("not-a-uuid")).toEqual({
      success: false,
    });
  });

  it("normalizes and validates titles", () => {
    expect(TodoTitle.create("  Write tests  ").value).toBe("Write tests");
    expect(() => TodoTitle.create("   ")).toThrow(ValidationException);
    expect(() => TodoTitle.create("a".repeat(101))).toThrow(ValidationException);
  });

  it("normalizes and validates descriptions", () => {
    expect(TodoDescription.create("  Useful detail  ").value).toBe("Useful detail");
    expect(() => TodoDescription.create("a".repeat(1001))).toThrow(ValidationException);
  });
});
