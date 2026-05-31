import { Todo } from "../../../domain/todo/entities/todo";
import type { TodoRepository } from "../../../domain/todo/repositories/todo-repository";
import { TodoDescription } from "../../../domain/todo/value-objects/todo-description";
import { TodoTitle } from "../../../domain/todo/value-objects/todo-title";

export type CreateTodoUseCaseInput = {
  description?: string | null | undefined;
  title: string;
};

export class CreateTodoUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(input: CreateTodoUseCaseInput): Promise<Todo> {
    const todo = Todo.create({
      description:
        input.description === undefined || input.description === null
          ? null
          : TodoDescription.create(input.description),
      title: TodoTitle.create(input.title),
    });

    await this.todoRepository.save(todo);

    return todo;
  }
}
