import { type Brand, type EntityIdValue, makeIdVO } from "../../shared";

/**
 * Branded UUID identifier for Todo entities.
 */
export type TodoId = Brand<EntityIdValue, "TodoId">;

/**
 * Parser and generator for {@link TodoId} values.
 */
export const TodoId = makeIdVO("TodoId");
