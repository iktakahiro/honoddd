import type { TodoRepository } from "../../../domain/todo/repositories/todo-repository";
import { TodoId } from "../../../domain/todo/value-objects/todo-id";
import { EntityNotFoundException } from "../../../domain/shared";

export class DeleteTodoUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(id: string): Promise<{ id: string }> {
    const todoId = TodoId.parse(id);
    const todo = await this.todoRepository.findById(todoId);

    if (todo === null) {
      throw new EntityNotFoundException("Todo", id);
    }

    await this.todoRepository.delete(todoId);

    return {
      id,
    };
  }
}
