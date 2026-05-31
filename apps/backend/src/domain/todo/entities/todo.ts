import { DomainException, Entity } from "../../shared";
import { TodoDescription } from "../value-objects/todo-description";
import { TodoId } from "../value-objects/todo-id";
import { TodoStatus } from "../value-objects/todo-status";
import { TodoTitle } from "../value-objects/todo-title";

export type TodoSnapshot = {
  completedAt: Date | null;
  createdAt: Date;
  description: TodoDescription | null;
  id: TodoId;
  status: TodoStatus;
  title: TodoTitle;
  updatedAt: Date;
};

export class Todo extends Entity<TodoId> {
  private completedAtValue: Date | null;
  private descriptionValue: TodoDescription | null;
  private statusValue: TodoStatus;
  private titleValue: TodoTitle;

  private constructor(
    id: TodoId,
    title: TodoTitle,
    description: TodoDescription | null,
    status: TodoStatus,
    createdAt: Date,
    updatedAt: Date,
    completedAt: Date | null,
  ) {
    super(id, createdAt, updatedAt);
    this.titleValue = title;
    this.descriptionValue = description;
    this.statusValue = status;
    this.completedAtValue = completedAt;
  }

  static create(input: {
    description?: TodoDescription | null;
    id?: TodoId;
    now?: Date;
    title: TodoTitle;
  }): Todo {
    const now = input.now ?? new Date();

    return new Todo(
      input.id ?? TodoId.generate(),
      input.title,
      input.description ?? null,
      TodoStatus.NotStarted,
      now,
      now,
      null,
    );
  }

  static restore(snapshot: TodoSnapshot): Todo {
    return new Todo(
      snapshot.id,
      snapshot.title,
      snapshot.description,
      snapshot.status,
      snapshot.createdAt,
      snapshot.updatedAt,
      snapshot.completedAt,
    );
  }

  get completedAt(): Date | null {
    return this.completedAtValue;
  }

  get description(): TodoDescription | null {
    return this.descriptionValue;
  }

  get status(): TodoStatus {
    return this.statusValue;
  }

  get title(): TodoTitle {
    return this.titleValue;
  }

  complete(now = new Date()): void {
    if (this.statusValue === TodoStatus.Completed) {
      return;
    }

    if (this.statusValue !== TodoStatus.InProgress) {
      throw new DomainException("Only in-progress todos can be completed");
    }

    this.statusValue = TodoStatus.Completed;
    this.completedAtValue = now;
    this.touch(now);
  }

  snapshot(): TodoSnapshot {
    return {
      completedAt: this.completedAtValue,
      createdAt: this.createdAt,
      description: this.descriptionValue,
      id: this.id,
      status: this.statusValue,
      title: this.titleValue,
      updatedAt: this.updatedAt,
    };
  }

  start(now = new Date()): void {
    if (this.statusValue === TodoStatus.InProgress) {
      return;
    }

    if (this.statusValue === TodoStatus.Completed) {
      throw new DomainException("Completed todos cannot be restarted");
    }

    this.statusValue = TodoStatus.InProgress;
    this.touch(now);
  }

  update(input: { description?: TodoDescription | null; now?: Date; title?: TodoTitle }): void {
    if (input.title !== undefined) {
      this.titleValue = input.title;
    }

    if (input.description !== undefined) {
      this.descriptionValue = input.description;
    }

    this.touch(input.now);
  }
}
