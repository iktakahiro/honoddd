import type { Todo } from "../../../domain/todo/entities/todo";
import type { TodoRepository } from "../../../domain/todo/repositories/todo-repository";
import { TodoDescription } from "../../../domain/todo/value-objects/todo-description";
import { TodoId } from "../../../domain/todo/value-objects/todo-id";
import { TodoTitle } from "../../../domain/todo/value-objects/todo-title";
import { EntityNotFoundException } from "../../../domain/shared";

export type UpdateTodoUseCaseInput = {
  description?: string | null | undefined;
  id: string;
  title?: string | undefined;
};

export class UpdateTodoUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(input: UpdateTodoUseCaseInput): Promise<Todo> {
    const todoId = TodoId.parse(input.id);
    const todo = await this.todoRepository.findById(todoId);

    if (todo === null) {
      throw new EntityNotFoundException("Todo", input.id);
    }

    const updateInput: {
      description?: TodoDescription | null;
      title?: TodoTitle;
    } = {};

    if (input.description !== undefined) {
      updateInput.description =
        input.description === null ? null : TodoDescription.create(input.description);
    }

    if (input.title !== undefined) {
      updateInput.title = TodoTitle.create(input.title);
    }

    todo.update(updateInput);

    await this.todoRepository.save(todo);

    return todo;
  }
}
