import type { Todo } from "../../../domain/todo/entities/todo";
import type { TodoRepository } from "../../../domain/todo/repositories/todo-repository";
import { TodoId } from "../../../domain/todo/value-objects/todo-id";
import { EntityNotFoundException } from "../../../domain/shared";

export class StartTodoUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(id: string): Promise<Todo> {
    const todoId = TodoId.parse(id);
    const todo = await this.todoRepository.findById(todoId);

    if (todo === null) {
      throw new EntityNotFoundException("Todo", id);
    }

    todo.start();
    await this.todoRepository.save(todo);

    return todo;
  }
}
