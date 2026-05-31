/**
 * Lifecycle states supported by the Todo aggregate.
 */
export const TodoStatus = {
  Completed: "completed",
  InProgress: "in_progress",
  NotStarted: "not_started",
} as const;

/**
 * Union type for Todo lifecycle states.
 */
export type TodoStatus = (typeof TodoStatus)[keyof typeof TodoStatus];
