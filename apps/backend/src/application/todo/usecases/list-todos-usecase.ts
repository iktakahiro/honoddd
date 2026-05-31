import type { Todo } from "../../../domain/todo/entities/todo";
import type { TodoRepository } from "../../../domain/todo/repositories/todo-repository";
import type { TodoStatus } from "../../../domain/todo/value-objects/todo-status";

export class ListTodosUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(filter?: { status?: TodoStatus }): Promise<Todo[]> {
    return this.todoRepository.findAll(filter);
  }
}
