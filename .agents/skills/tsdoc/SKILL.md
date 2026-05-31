---
name: tsdoc
description: Write, review, and update TypeScript Doc Comments using TSDoc. Use when adding documentation for TypeScript interfaces, abstract types, functions, private methods, concrete implementations, repositories, use cases, or when checking that comments follow the project's English TSDoc style.
---

# TSDoc

## Purpose

Use this skill to write consistent English TSDoc comments for TypeScript code. Follow the official TSDoc guide at https://tsdoc.org/ and keep comments focused on public contracts, non-obvious constraints, side effects, and implementation-specific behavior.

## Core Rules

- Write all TypeScript Doc Comments in English and in TSDoc format.
- Start every Doc Comment with a concise one-line summary before any block tag.
- Add `@remarks`, `@param`, `@returns`, and `@throws` only when they clarify information that is not already obvious from names and types.
- Use `@remarks` for longer explanation after the summary.
- Use `@param name - Description.` for parameters.
- Use `@returns Description.` for return values when the return behavior needs documentation.
- Use a separate `@throws` block for each meaningful error condition.
- Use inline links as `{@link Symbol}` or `{@link Interface.method}` when referring to an API item.

## Required Comments

- Add Doc Comments to every interface and abstract type. Document the public contract: purpose, return behavior, error conditions, invariants, and externally visible side effects.
- Add Doc Comments to top-level or class-external functions.
- Add Doc Comments to private methods. Keep them concise and document why the helper exists, what invariant it protects, or what workflow detail it hides.
- Do not add comments to ordinary properties or methods outside the required documentation targets when their intent is obvious from names and types. Comment only special constraints, default values, invariants, side effects, or domain rules that cannot be inferred from the declaration.
- Keep non-Doc Comments to the minimum needed. Do not explain obvious statements or mechanical implementation steps.

## Interfaces And Implementations

- Treat interfaces and abstract types as the source of truth for public contracts.
- On implementation classes and concrete methods, link to the interface member with `{@link Interface.method}`.
- Do not repeat the same `@param` or `@returns` documentation from the interface in the implementation. The link is enough when behavior is identical.
- Add implementation-specific notes only when they matter, such as storage behavior, transaction handling, authorization context, framework-specific behavior, side effects, or additional constraints.
- If an implementation adds side effects or error conditions, document them with `@throws`.
- For repository implementations, link to the repository interface and mention only infrastructure-specific details. For example, a Drizzle repository can link to the interface contract and add Drizzle-specific transaction, context, constraint, or mapping behavior.

## Tag Formatting

- Separate the summary from the first block tag with a blank line.
- When listing block tags, insert blank lines between tag groups for readability.
- Consecutive `@param` tags may stay together without blank lines between each parameter.
- Always place a blank line before `@returns`.
- Place a blank line before each `@throws` block or group of `@throws` blocks.
- Keep comments concise. Prefer one sentence per summary and short tag descriptions.

## Preferred Patterns

Interface or abstract contract:

```ts
/**
 * Repository abstraction for integrated calendars.
 *
 * @remarks
 * Public contract for persistence.
 */
export interface IntegratedCalendarRepository {
  /**
   * Retrieves a calendar by identifier.
   *
   * @param ctx - Transaction context.
   * @param id - Integrated calendar identifier.
   *
   * @returns Integrated calendar domain object.
   */
  get(ctx: TransactionContext, id: IntegratedCalendarId): Promise<IntegratedCalendar>;
}
```

Implementation that follows an interface contract:

```ts
/**
 * Drizzle implementation of {@link IntegratedCalendarRepository}.
 */
export class IntegratedCalendarDrizzleRepository implements IntegratedCalendarRepository {
  /**
   * Retrieves a calendar by identifier.
   *
   * @remarks
   * See {@link IntegratedCalendarRepository.get}. Uses the Drizzle transaction
   * bound to the provided context.
   *
   * @throws {Error} When organization context is missing.
   * @throws {EntityNotFoundException} When the organization is not found.
   */
  async get(ctx: TransactionContext, id: IntegratedCalendarId): Promise<IntegratedCalendar> {
    // implementation detail...
  }
}
```

Implementation with no extra behavior:

```ts
/**
 * Drizzle implementation of {@link TodoRepository}.
 */
export class TodoDrizzleRepository implements TodoRepository {
  /**
   * {@link TodoRepository.complete}
   */
  async complete(ctx: TransactionContext, id: TodoId): Promise<void> {
    // implementation detail...
  }
}
```

## Review Checklist

- Is the comment in English and valid TSDoc?
- Does the first line summarize the API item clearly?
- Are interface and abstract type contracts documented?
- Do implementation comments link to interface members instead of duplicating contract tags?
- Are additional implementation side effects and error conditions documented with `@throws`?
- Are tag groups separated with blank lines, especially before `@returns`?
- Are obvious property, method, and implementation comments omitted?
- Are non-Doc Comments limited to genuinely useful implementation context?
