import { z } from "zod";

export const TodoStatusSchema = z.enum(["not_started", "in_progress", "completed"]);

export const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).nullable(),
  status: TodoStatusSchema,
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TodoIdInputSchema = z.object({
  id: z.string().uuid(),
});

export const FindTodosInputSchema = z.object({
  status: TodoStatusSchema.optional(),
});

export const FindTodosOutputSchema = z.object({
  items: z.array(TodoSchema),
});

export const CreateTodoInputSchema = z.object({
  description: z.string().max(1000).nullable().optional(),
  title: z.string().min(1).max(100),
});

export const UpdateTodoInputSchema = z
  .object({
    description: z.string().max(1000).nullable().optional(),
    id: z.string().uuid(),
    title: z.string().min(1).max(100).optional(),
  })
  .refine((input) => input.title !== undefined || input.description !== undefined, {
    message: "Either title or description is required",
  });

export type TodoStatus = z.infer<typeof TodoStatusSchema>;
export type TodoResponse = z.infer<typeof TodoSchema>;
export type FindTodosInput = z.infer<typeof FindTodosInputSchema>;
export type FindTodosOutput = z.infer<typeof FindTodosOutputSchema>;
export type CreateTodoInput = z.infer<typeof CreateTodoInputSchema>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoInputSchema>;
