import { z } from "zod";

/**
 * Schema for Todo lifecycle status values.
 */
export const TodoStatusSchema = z.enum(["not_started", "in_progress", "completed"]);

/**
 * Schema for Todo API responses.
 */
export const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).nullable(),
  status: TodoStatusSchema,
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Schema for requests that identify a Todo by path parameter.
 */
export const TodoIdInputSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Schema for listing Todos.
 */
export const FindTodosInputSchema = z.object({
  status: TodoStatusSchema.optional(),
});

/**
 * Schema for Todo list responses.
 */
export const FindTodosOutputSchema = z.object({
  items: z.array(TodoSchema),
});

/**
 * Schema for Todo creation requests.
 */
export const CreateTodoInputSchema = z.object({
  description: z.string().max(1000).nullable().optional(),
  title: z.string().min(1).max(100),
});

/**
 * Schema for Todo update requests.
 */
export const UpdateTodoInputSchema = z
  .object({
    description: z.string().max(1000).nullable().optional(),
    id: z.string().uuid(),
    title: z.string().min(1).max(100).optional(),
  })
  .refine((input) => input.title !== undefined || input.description !== undefined, {
    message: "Either title or description is required",
  });

/**
 * Todo status type inferred from {@link TodoStatusSchema}.
 */
export type TodoStatus = z.infer<typeof TodoStatusSchema>;

/**
 * Todo response type inferred from {@link TodoSchema}.
 */
export type TodoResponse = z.infer<typeof TodoSchema>;

/**
 * Todo list input type inferred from {@link FindTodosInputSchema}.
 */
export type FindTodosInput = z.infer<typeof FindTodosInputSchema>;

/**
 * Todo list response type inferred from {@link FindTodosOutputSchema}.
 */
export type FindTodosOutput = z.infer<typeof FindTodosOutputSchema>;

/**
 * Todo creation input type inferred from {@link CreateTodoInputSchema}.
 */
export type CreateTodoInput = z.infer<typeof CreateTodoInputSchema>;

/**
 * Todo update input type inferred from {@link UpdateTodoInputSchema}.
 */
export type UpdateTodoInput = z.infer<typeof UpdateTodoInputSchema>;
