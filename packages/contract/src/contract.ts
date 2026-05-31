import { oc } from "@orpc/contract";

import {
  CreateTodoInputSchema,
  FindTodosInputSchema,
  FindTodosOutputSchema,
  TodoIdInputSchema,
  TodoSchema,
  UpdateTodoInputSchema,
} from "./schemas";

const todoTags = ["Todo"];

export const contract = {
  todo: {
    create: oc
      .route({
        method: "POST",
        path: "/todos",
        successStatus: 201,
        tags: todoTags,
      })
      .input(CreateTodoInputSchema)
      .output(TodoSchema),
    list: oc
      .route({
        method: "GET",
        path: "/todos",
        successStatus: 200,
        tags: todoTags,
      })
      .input(FindTodosInputSchema)
      .output(FindTodosOutputSchema),
    findById: oc
      .route({
        method: "GET",
        path: "/todos/{id}",
        successStatus: 200,
        tags: todoTags,
      })
      .input(TodoIdInputSchema)
      .output(TodoSchema),
    update: oc
      .route({
        method: "PATCH",
        path: "/todos/{id}",
        successStatus: 200,
        tags: todoTags,
      })
      .input(UpdateTodoInputSchema)
      .output(TodoSchema),
    remove: oc
      .route({
        method: "DELETE",
        path: "/todos/{id}",
        successStatus: 200,
        tags: todoTags,
      })
      .input(TodoIdInputSchema)
      .output(TodoIdInputSchema),
    start: oc
      .route({
        method: "POST",
        path: "/todos/{id}/start",
        successStatus: 200,
        tags: todoTags,
      })
      .input(TodoIdInputSchema)
      .output(TodoSchema),
    complete: oc
      .route({
        method: "POST",
        path: "/todos/{id}/complete",
        successStatus: 200,
        tags: todoTags,
      })
      .input(TodoIdInputSchema)
      .output(TodoSchema),
  },
};

export type AppContract = typeof contract;
