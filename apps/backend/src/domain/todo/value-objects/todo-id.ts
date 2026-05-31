import type { Brand, EntityIdValue } from "../../shared";
import { makeIdVO } from "../../shared";

export type TodoId = Brand<EntityIdValue, "TodoId">;
export const TodoId = makeIdVO("TodoId");
