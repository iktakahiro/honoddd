import { oc } from "@orpc/contract";

import {
  CreateTodoInputSchema,
  FindTodosInputSchema,
  FindTodosOutputSchema,
  TodoIdInputSchema,
  TodoSchema,
  UpdateTodoInputSchema,
} from "./schemas";

export const contract = {
  todo: {
    complete: oc
      .route({
        method: "POST",
        path: "/todos/{id}/complete",
        successStatus: 200,
        tags: ["todos"],
      })
      .input(TodoIdInputSchema)
      .output(TodoSchema),
    create: oc
      .route({
        method: "POST",
        path: "/todos",
        successStatus: 201,
        tags: ["todos"],
      })
      .input(CreateTodoInputSchema)
      .output(TodoSchema),
    findById: oc
      .route({
        method: "GET",
        path: "/todos/{id}",
        successStatus: 200,
        tags: ["todos"],
      })
      .input(TodoIdInputSchema)
      .output(TodoSchema),
    list: oc
      .route({
        method: "GET",
        path: "/todos",
        successStatus: 200,
        tags: ["todos"],
      })
      .input(FindTodosInputSchema)
      .output(FindTodosOutputSchema),
    remove: oc
      .route({
        method: "DELETE",
        path: "/todos/{id}",
        successStatus: 200,
        tags: ["todos"],
      })
      .input(TodoIdInputSchema)
      .output(TodoIdInputSchema),
    start: oc
      .route({
        method: "POST",
        path: "/todos/{id}/start",
        successStatus: 200,
        tags: ["todos"],
      })
      .input(TodoIdInputSchema)
      .output(TodoSchema),
    update: oc
      .route({
        method: "PATCH",
        path: "/todos/{id}",
        successStatus: 200,
        tags: ["todos"],
      })
      .input(UpdateTodoInputSchema)
      .output(TodoSchema),
  },
};

export type AppContract = typeof contract;
