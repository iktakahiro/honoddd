# honoddd

A Practical Reference Implementation of DDD & Onion Architecture with Hono, oRPC, and TypeScript

English | [日本語](README.ja_JP.md)

**NOTE**: This repository demonstrates how to structure a small web API with DDD and Onion Architecture. Before adapting it to production, add authentication, authorization, observability, migration management, and operational security for your own environment.

## Tech Stack

- [Bun](https://bun.sh/) for runtime, package management, and tests
- [Turborepo](https://turbo.build/repo) for monorepo task orchestration
- [Hono](https://hono.dev/) for the backend HTTP API
- [oRPC](https://orpc.unnoq.com/) for shared contract definitions and OpenAPI generation
- [Zod](https://zod.dev/) for schema validation
- [Drizzle ORM](https://orm.drizzle.team/) for database access
- [PGlite](https://pglite.dev/) for embedded PostgreSQL-compatible storage
- [Scalar](https://github.com/scalar/scalar) for API reference documentation
- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for code quality

## Prerequisites

- Bun 1.3.14 or compatible
- Node.js 24 or compatible for GitHub Actions parity

## Project Setup

Install dependencies:

```sh
bun install
```

Start all development apps:

```sh
bun run dev
```

This starts the backend API and the API documentation app together. If you need to run them separately:

```sh
bun run dev:backend
bun run dev:api-doc
```

Run all validation tasks:

```sh
bun run validate
```

The backend defaults to `http://localhost:3000`.
The API docs default to `http://localhost:3001`.
The backend stores local PGlite data in `apps/backend/.pglite` by default. Set `PGLITE_DATA_DIR` to use another data directory, or pass an explicit `new PGlite()` in tests for in-memory databases.

## Workspace

- `apps/backend`: Hono REST API backed by oRPC handlers and Drizzle/PGlite.
- `apps/api-doc`: Scalar API reference generated from the shared oRPC contract.
- `packages/contract`: oRPC contract, Zod schemas, and OpenAPI generation.
- `packages/typescript-config`: Shared TypeScript configuration for workspace packages.

## Code Architecture

The backend follows Onion Architecture. Inner layers describe business concepts and application behavior. Outer layers adapt those concepts to HTTP, OpenAPI, and PostgreSQL-compatible persistence.

```tree
.
|-- apps
|   |-- api-doc
|   |   `-- src
|   |       |-- app.ts
|   |       `-- index.ts
|   `-- backend
|       `-- src
|           |-- api
|           |   |-- app.ts
|           |   |-- orpc-context.ts
|           |   |-- orpc-router.ts
|           |   `-- todo-presenter.ts
|           |-- application
|           |   `-- todo
|           |       `-- usecases
|           |           |-- create-todo-usecase.ts
|           |           |-- update-todo-usecase.ts
|           |           |-- start-todo-usecase.ts
|           |           |-- complete-todo-usecase.ts
|           |           |-- find-todo-usecase.ts
|           |           |-- list-todos-usecase.ts
|           |           `-- delete-todo-usecase.ts
|           |-- domain
|           |   |-- shared
|           |   `-- todo
|           |       |-- entities
|           |       |-- repositories
|           |       `-- value-objects
|           |-- bootstrap
|           |   `-- app-container.ts
|           |-- infrastructure
|           |   `-- psql
|           |       |-- drizzle
|           |       |   |-- drizzle-database.ts
|           |       |   |-- drizzle-transaction.ts
|           |       |   |-- schemas
|           |       |   |   `-- todo-schema.ts
|           |       |   `-- todo
|           |       |       `-- repositories
|           |       |           |-- drizzle-todo-repository.ts
|           |       |           `-- todo-mapper.ts
|           |       `-- migrations
|           `-- index.ts
|-- packages
|   |-- contract
|   |   `-- src
|   |       |-- contract.ts
|   |       |-- openapi.ts
|   |       `-- schemas.ts
|   `-- typescript-config
`-- turbo.json
```

## Implemented Practices

### Domain Layer

The domain layer contains entities, value objects, domain exceptions, and repository interfaces. It does not import Hono, oRPC, Drizzle, PGlite, or HTTP-specific types.

#### Entity

`Todo` is modeled as an aggregate root. It owns its identifier, state, lifecycle transitions, and persisted snapshot.

```ts
export class Todo extends Entity<TodoId> {
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
}
```

> [!TIP]
> Keep lifecycle rules on the entity that owns the lifecycle. HTTP handlers and repositories should not duplicate status transition rules.

#### Value Objects

Single-value identifiers use branded types created by `makeIdVO`. Other value objects, such as `TodoTitle` and `TodoDescription`, validate and normalize their own values.

```ts
export type TodoId = Brand<EntityIdValue, "TodoId">;
export const TodoId = makeIdVO("TodoId");

export const makeIdVO = <B extends string>(label: B) => {
  type Id = Brand<EntityIdValue, B>;

  return {
    parse(input: unknown): Id {
      if (typeof input !== "string") {
        throw new ValidationException(`${label} must be a string`);
      }

      return assertUuid(input, label) as Id;
    },
    generate(): Id {
      return assertUuid(crypto.randomUUID(), label) as Id;
    },
  } as const;
};
```

> [!TIP]
> Branded IDs reduce the risk of passing a plain string where a domain ID is expected, and value objects make domain validation reusable before values reach entities or repositories.

#### Repository Interface

The repository interface is defined in the domain layer. Its concrete Drizzle implementation lives in the infrastructure layer.

```ts
export interface TodoRepository {
  create(todo: Todo, ctx?: TransactionContext): Promise<void>;

  update(todo: Todo, ctx?: TransactionContext): Promise<void>;

  findById(todoId: TodoId, ctx?: TransactionContext): Promise<Todo | null>;

  list(filter?: { status?: TodoStatus }, ctx?: TransactionContext): Promise<Todo[]>;

  delete(todoId: TodoId, ctx?: TransactionContext): Promise<void>;
}
```

> [!TIP]
> Use cases need the capability to persist aggregates, not a dependency on Drizzle, SQL, PGlite, or a table shape. This keeps dependencies pointing inward.

### Application Layer

The application layer contains one use case class per application action.

#### One Use Case, One Public Method

Use case files follow names such as `create-todo-usecase.ts`, and each class exposes a single public `execute` method.

```ts
export class CreateTodoUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(input: CreateTodoUseCaseInput): Promise<Todo> {
    const todo = Todo.create({
      description:
        input.description === undefined || input.description === null
          ? null
          : TodoDescription.create(input.description),
      title: TodoTitle.create(input.title),
    });

    await this.transactionManager.runInTransaction((ctx) => this.todoRepository.create(todo, ctx));

    return todo;
  }
}
```

> [!TIP]
> A use case is an application action, and often a transaction boundary as well. Keeping one public action per class keeps policies and persistence calls easy to test.

#### Explicit Transactions

Use cases depend on `TransactionManager` and explicitly wrap the database work that must commit or roll back together.

```ts
export class StartTodoUseCase {
  async execute(id: string): Promise<Todo> {
    const todoId = TodoId.parse(id);

    return this.transactionManager.runInTransaction(async (ctx) => {
      const todo = await this.todoRepository.findById(todoId, ctx);

      if (todo === null) {
        throw new EntityNotFoundException("Todo", id);
      }

      todo.start();
      await this.todoRepository.update(todo, ctx);

      return todo;
    });
  }
}
```

> [!TIP]
> A transaction does not always match an HTTP request. When a use case calls external services or waits for an AI/API response, placing the transaction inside the use case keeps the database lock window intentional and short.

### Contract Package

The contract package defines API routes, request schemas, response schemas, and OpenAPI generation.

`packages/contract` owns the oRPC contract and Zod schemas. The backend implements the contract, and the API documentation app generates OpenAPI from it.

```ts
export const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).nullable(),
  status: TodoStatusSchema,
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const contract = {
  todo: {
    create: oc
      .route({
        method: "POST",
        path: "/todos",
        successStatus: 201,
        tags: ["Todo"],
      })
      .input(CreateTodoInputSchema)
      .output(TodoSchema),
  },
};
```

> [!TIP]
> The contract is a shared artifact. A future frontend can consume the same endpoint paths and payload types without re-declaring the API surface.

### API Layer

The API layer uses Hono and oRPC to translate HTTP requests into use case calls.

#### Composition Root

`apps/backend/src/bootstrap/app-container.ts` constructs concrete infrastructure and injects it into use cases.

```ts
export function createAppContainer(options: AppContainerOptions = {}): AppContainer {
  const db = options.db ?? createDrizzleDatabase();
  const ready = options.ready ?? migrateDrizzleSchema(db);
  const todoRepository = new DrizzleTodoRepository(db, ready);
  const transactionManager = new DrizzleTransactionManager(db, ready);

  return {
    async dispose(): Promise<void> {
      await todoRepository.close();
    },
    todoUseCases: {
      createTodo: new CreateTodoUseCase(todoRepository, transactionManager),
      startTodo: new StartTodoUseCase(todoRepository, transactionManager),
      completeTodo: new CompleteTodoUseCase(todoRepository, transactionManager),
    },
  };
}
```

> [!TIP]
> Object construction is a composition concern. Keeping it in one container keeps repository lifecycle, migration readiness, and shutdown behavior out of handlers and use cases.

#### oRPC Context and Handlers

The Hono app passes the container and request-scoped values to oRPC handlers through context.

```ts
app.use("*", async (c, next) => {
  const context: ORPCContext = {
    container,
    requestId: c.get("requestId"),
  };

  const { matched, response } = await handler.handle(c.req.raw, {
    context,
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});
```

The router maps contract operations to use cases and translates domain exceptions into API errors.

```ts
return os.router({
  todo: {
    start: os.todo.start.handler(({ context, input }) =>
      mapApplicationErrors(async () =>
        presentTodo(await context.container.todoUseCases.startTodo.execute(input.id)),
      ),
    ),
  },
});
```

> [!TIP]
> Hono stays a thin HTTP adapter, while oRPC receives the context its handlers actually use. Request IDs and future authentication context can be added without changing use case constructors.

### Infrastructure Layer

The infrastructure layer contains Drizzle, PGlite, schema definitions, and mappers.

#### Drizzle Repository

`DrizzleTodoRepository` implements the domain repository interface using Drizzle and PGlite.

```ts
export class DrizzleTodoRepository implements TodoRepository {
  async create(todo: Todo, ctx?: TransactionContext): Promise<void> {
    await this.ready;

    await this.getExecutor(ctx).insert(todoTable).values(toTodoTableInsert(todo));
  }

  async findById(todoId: TodoId, ctx?: TransactionContext): Promise<Todo | null> {
    await this.ready;

    const [row] = await this.getExecutor(ctx)
      .select()
      .from(todoTable)
      .where(eq(todoTable.id, todoId))
      .limit(1);

    return row === undefined ? null : toTodo(row);
  }

  private getExecutor(ctx?: TransactionContext): DrizzleExecutor {
    return ctx === undefined ? this.db : getDrizzleTransaction(ctx);
  }
}
```

> [!TIP]
> PGlite gives this reference implementation PostgreSQL-compatible behavior without requiring a separate database server. Drizzle keeps table access typed while database details stay in infrastructure.

#### Mapper

`todo-mapper.ts` converts between database rows and the `Todo` aggregate.

```ts
export function toTodo(row: TodoTableRow): Todo {
  return Todo.restore({
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    description: row.description === null ? null : TodoDescription.create(row.description),
    id: TodoId.parse(row.id),
    status: row.status,
    title: TodoTitle.create(row.title),
    updatedAt: row.updatedAt,
  });
}

export function toTodoTableUpdate(todo: Todo): TodoTableUpdate {
  const snapshot = todo.snapshot();

  return {
    completedAt: snapshot.completedAt,
    description: snapshot.description?.value ?? null,
    status: snapshot.status,
    title: snapshot.title.value,
    updatedAt: snapshot.updatedAt,
  };
}
```

> [!TIP]
> Database rows are not domain objects. Explicit mappers prevent column names, nullable database fields, and ORM types from leaking into use cases.

#### Schema and Migrations

Drizzle schema files live under `src/infrastructure/psql/drizzle/schemas`, and generated SQL migrations live under `src/infrastructure/psql/migrations`.

```ts
export const todoTable = pgTable(
  "todos",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    status: todoStatusEnum("status").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("todos_status_idx").on(table.status)],
);
```

```ts
export async function migrateDrizzleSchema(db: DrizzleDatabase): Promise<void> {
  await migrate(db, {
    migrationsFolder,
  });
}
```

> [!TIP]
> PGlite behaves like a PostgreSQL-compatible database, so generated SQL migrations can be the schema history for both local embedded storage and a future PostgreSQL deployment.

#### Transaction Adapter

`DrizzleTransactionManager` wraps concrete Drizzle transactions behind the domain-level `TransactionContext`.

```ts
export class DrizzleTransactionManager implements TransactionManager {
  async runInTransaction<T>(operation: (ctx: TransactionContext) => Promise<T>): Promise<T> {
    await this.ready;

    return this.db.transaction((tx) => operation(new DrizzleTransactionContext(tx)));
  }
}
```

> [!TIP]
> Use cases express transactional intent without importing Drizzle types. Only repository implementations retrieve the concrete transaction, and only inside the infrastructure layer.

### API Documentation

The API documentation app is a separate workspace app. It serves Scalar UI and `/openapi.json` from `packages/contract`.

```ts
app.get("/openapi.json", async (c) =>
  c.json(
    await createOpenAPISpec({
      servers: [
        {
          description: "Backend API",
          url: Bun.env.BACKEND_API_URL ?? "http://localhost:3000",
        },
      ],
    }),
  ),
);

app.get(
  "/",
  Scalar({
    orderSchemaPropertiesBy: "preserve",
    pageTitle: "Hono DDD API Reference",
    url: "/openapi.json",
  }),
);
```

> [!TIP]
> API documentation is deployed and tested as an app, but it does not own API definitions. The docs are generated from the same contract used by the backend.

### Monorepo Tooling

This repository uses Bun workspaces and Turborepo.

Package-local scripts run builds, type checks, and tests, while root scripts orchestrate them through Turbo.

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "check": "turbo run check",
    "validate": "turbo run build check"
  },
  "packageManager": "bun@1.3.14"
}
```

Shared TypeScript settings live in `packages/typescript-config` and are consumed by each workspace package.

```json
{
  "extends": "../../packages/typescript-config/base.json",
  "compilerOptions": {
    "types": ["bun"]
  },
  "include": ["src/**/*.ts"]
}
```

> [!TIP]
> Each package owns the commands that make sense for it, while the root validates the workspace graph with Turbo caching. TypeScript settings are versioned as a workspace package instead of copied into every app.

### Code Quality

The repository uses Oxlint and Oxfmt.

```json
{
  "scripts": {
    "lint": "oxlint .",
    "lint:fix": "oxlint --fix .",
    "format": "oxfmt --check",
    "format:fix": "oxfmt ."
  }
}
```

> [!TIP]
> Fast linting and formatting reduce friction enough that checks can run frequently in local development and CI.

### Supply Chain Safety

Dependency updates are intentionally conservative.

`bunfig.toml` sets `minimumReleaseAge` to seven days.

```toml
[install]
minimumReleaseAge = 604800
```

`.ncurc.json` configures npm-check-updates with a seven-day cooldown and exact versions.

```json
{
  "cooldown": 7,
  "removeRange": true,
  "format": ["group"],
  "peer": true
}
```

> [!TIP]
> Waiting before installing freshly published versions reduces exposure to short-lived malicious releases. Exact versions also make dependency diffs and audits easier to review.

### CI

GitHub Actions runs checks on pushes to `main` and `develop`, and on pull requests.

```yaml
- name: Install dependencies
  run: bun install --frozen-lockfile

- name: Audit dependencies
  run: bun audit --audit-level high

- name: Run tests and checks
  run: bun turbo run type-check test quality --cache-dir="$HOME/.cache/turbo"
```

> [!TIP]
> CI validates code, dependencies, and workflow configuration before changes are merged or pushed to shared branches.

## REST API

Create a todo:

```sh
curl --location --request POST "http://localhost:3000/todos" \
  --header "Content-Type: application/json" \
  --data-raw '{
    "title": "Implement DDD architecture",
    "description": "Create a sample application using Hono and oRPC"
  }'
```

List todos:

```sh
curl --location "http://localhost:3000/todos"
```

Find a todo:

```sh
curl --location "http://localhost:3000/todos/550e8400-e29b-41d4-a716-446655440000"
```

Start a todo:

```sh
curl --location --request POST "http://localhost:3000/todos/550e8400-e29b-41d4-a716-446655440000/start"
```

Complete a todo:

```sh
curl --location --request POST "http://localhost:3000/todos/550e8400-e29b-41d4-a716-446655440000/complete"
```

Update a todo:

```sh
curl --location --request PATCH "http://localhost:3000/todos/550e8400-e29b-41d4-a716-446655440000" \
  --header "Content-Type: application/json" \
  --data-raw '{
    "title": "Updated title",
    "description": "Updated description"
  }'
```

Delete a todo:

```sh
curl --location --request DELETE "http://localhost:3000/todos/550e8400-e29b-41d4-a716-446655440000"
```

## Development

Run tests:

```sh
bun run test
```

Run type checks:

```sh
bun run type-check
```

Run lint:

```sh
bun run lint
```

Run format check:

```sh
bun run format
```

Generate a Drizzle migration after editing schema files:

```sh
bun --cwd apps/backend run db:generate
```

Apply migrations to a local PGlite data directory:

```sh
PGLITE_DATA_DIR=./.pglite bun --cwd apps/backend run db:migrate
```

Apply automatic fixes:

```sh
bun run fix
```

## Related Repositories

- [iktakahiro/dddpy](https://github.com/iktakahiro/dddpy): Python DDD & Onion Architecture example
- [iktakahiro/oniongo](https://github.com/iktakahiro/oniongo): Go DDD & Onion Architecture example

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
