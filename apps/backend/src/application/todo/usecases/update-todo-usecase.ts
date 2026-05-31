import { EntityNotFoundException, type TransactionManager } from "../../../domain/shared";
import type { Todo } from "../../../domain/todo/entities/todo";
import type { TodoRepository } from "../../../domain/todo/repositories/todo-repository";
import { TodoDescription } from "../../../domain/todo/value-objects/todo-description";
import { TodoId } from "../../../domain/todo/value-objects/todo-id";
import { TodoTitle } from "../../../domain/todo/value-objects/todo-title";

export type UpdateTodoUseCaseInput = {
  description?: string | null | undefined;
  id: string;
  title?: string | undefined;
};

export class UpdateTodoUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(input: UpdateTodoUseCaseInput): Promise<Todo> {
    const todoId = TodoId.parse(input.id);
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

    return this.transactionManager.runInTransaction(async (ctx) => {
      const todo = await this.todoRepository.findById(todoId, ctx);

      if (todo === null) {
        throw new EntityNotFoundException("Todo", input.id);
      }

      todo.update(updateInput);
      await this.todoRepository.save(todo, ctx);

      return todo;
    });
  }
}
