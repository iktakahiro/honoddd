export const TodoStatus = {
  Completed: "completed",
  InProgress: "in_progress",
  NotStarted: "not_started",
} as const;

export type TodoStatus = (typeof TodoStatus)[keyof typeof TodoStatus];
