# honoddd

Hono、oRPC、TypeScript による DDD と Onion Architecture の実践的なリファレンス実装

[English](README.md) | 日本語

**注意**: このリポジトリは、小さな Web API を DDD と Onion Architecture で構成する方法を示すためのサンプルです。本番環境に適用する場合は、認証、認可、監視、マイグレーション管理、運用上のセキュリティを追加してください。

## 技術スタック

- [Bun](https://bun.sh/) - ランタイム、パッケージ管理、テスト
- [Turborepo](https://turbo.build/repo) - monorepo のタスク実行
- [Hono](https://hono.dev/) - backend の HTTP API
- [oRPC](https://orpc.unnoq.com/) - 共有 contract と OpenAPI 生成
- [Zod](https://zod.dev/) - スキーマバリデーション
- [Drizzle ORM](https://orm.drizzle.team/) - データベースアクセス
- [PGlite](https://pglite.dev/) - 組み込みの PostgreSQL 互換ストレージ
- [Scalar](https://github.com/scalar/scalar) - API リファレンス
- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) / [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) - コード品質

## 前提条件

- Bun 1.3.14 または互換バージョン
- GitHub Actions と揃える場合は Node.js 24 または互換バージョン

## セットアップ

依存関係をインストールします。

```sh
bun install
```

開発用アプリをまとめて起動します。

```sh
bun run dev
```

このコマンドで backend API と API ドキュメントが同時に起動します。個別に起動したい場合は、次のコマンドを使います。

```sh
bun run dev:backend
bun run dev:api-doc
```

全体の検証を実行します。

```sh
bun run validate
```

backend はデフォルトで `http://localhost:3000` です。
API ドキュメントはデフォルトで `http://localhost:3001` です。
backend はデフォルトで PGlite のデータを `apps/backend/.pglite` に保存します。別のディレクトリを使う場合は `PGLITE_DATA_DIR` を設定します。test では `new PGlite()` を明示的に渡すことで、in-memory database を利用できます。

## Workspace

- `apps/backend`: oRPC handler と Drizzle/PGlite を使った Hono REST API
- `apps/api-doc`: 共有 oRPC contract から生成する Scalar API リファレンス
- `packages/contract`: oRPC contract、Zod schema、OpenAPI 生成
- `packages/typescript-config`: workspace 共通の TypeScript 設定

## ソフトウェアアーキテクチャ

backend は Onion Architecture を採用しています。内側のレイヤーがビジネス概念とアプリケーションの振る舞いを表現し、外側のレイヤーがそれらを HTTP、OpenAPI、PostgreSQL 互換の永続化へ適応させます。

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

## 実践しているプラクティス

### Domain Layer

Domain Layer には Entity、Value Object、Domain Exception、Repository Interface を置きます。Hono、oRPC、Drizzle、PGlite や HTTP 固有の型は import しません。

#### Entity

`Todo` は Aggregate Root として実装しています。ID、状態、ライフサイクルの遷移、永続化用の snapshot を Entity 自身が保持します。

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
> ライフサイクルのルールは、それを所有する Entity に置くと見通しが良くなります。状態遷移の条件を HTTP handler や repository に重複させないようにします。

#### Value Object

単一値の ID は、`makeIdVO` で生成する branded type として表現します。`TodoTitle` や `TodoDescription` のような Value Object は、自身の値を検証・正規化します。

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
> branded ID は、ただの文字列を誤って domain ID として扱ってしまうリスクを下げます。Value Object にすると、Entity や Repository へ渡る前の domain validation を再利用しやすくなります。

#### Repository Interface

Repository Interface は Domain Layer に定義します。Drizzle による具象実装は Infrastructure Layer に置きます。

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
> UseCase が必要とするのは Aggregate を永続化する能力であって、Drizzle や SQL、PGlite、table の形そのものではありません。これにより、依存の方向を内側に保てます。

### Application Layer

Application Layer には、アプリケーションの操作単位ごとに UseCase を置きます。

#### 1 UseCase、1 Public Method

`create-todo-usecase.ts` のようなファイル名にし、1つの UseCase class には1つの public な `execute` method だけを持たせています。

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
> UseCase はアプリケーションの操作単位であり、多くの場合はトランザクションの境界にもなります。public な action を1つに絞ることで、ポリシーや永続化の呼び出しをテストしやすく保てます。

#### 明示的な Transaction

UseCase は `TransactionManager` に依存し、commit / rollback をまとめたい database 操作を明示的に囲みます。

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
> transaction の範囲が HTTP request 全体と一致するとは限りません。UseCase 内で外部サービスや AI/API の応答を待つ場合でも、transaction の範囲を UseCase 内で明示しておけば、database lock の時間を短く、意図したとおりに保てます。

### Contract Package

Contract package には API route、request schema、response schema、OpenAPI 生成を置きます。

`packages/contract` が oRPC contract と Zod schema を所有します。backend はその contract を実装し、API ドキュメント用の app は同じ contract から OpenAPI を生成します。

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
> API contract は backend と frontend の間で共有する成果物です。将来 frontend を追加するときも、endpoint の path や payload の型を再定義することなく、同じ API surface を利用できます。

### API Layer

API Layer では Hono と oRPC を使い、HTTP request を UseCase 呼び出しへ変換します。

#### Composition Root

`apps/backend/src/bootstrap/app-container.ts` が具象の infrastructure を作成し、UseCase に注入します。

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
> object の生成は composition の責務です。container に集約することで、repository の lifecycle、migration の readiness、shutdown の振る舞いを handler や UseCase から分離できます。

#### oRPC Context と Handler

Hono app は、application container と request スコープの値を oRPC context として handler に渡します。

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

router は contract の operation を UseCase に対応づけ、Domain Exception を API error に変換します。

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
> Hono は HTTP adapter の役割に留まり、oRPC handler が実際に使う context は oRPC へ渡します。これにより、request ID や将来の authentication context を、UseCase の constructor を変えずに追加できます。

### Infrastructure Layer

Infrastructure Layer には Drizzle、PGlite、schema definition、mapper を置きます。

#### Drizzle Repository

`DrizzleTodoRepository` は Drizzle と PGlite を使って domain の repository interface を実装します。

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
> PGlite を使うことで、このリファレンス実装では外部の database server なしに PostgreSQL 互換の振る舞いを得られます。Drizzle による table access の詳細は Infrastructure Layer に閉じ込めます。

#### Mapper

`todo-mapper.ts` は database row と `Todo` aggregate を相互変換します。

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
> database の row は domain object ではありません。明示的な mapper を置くことで、column 名や nullable な field、ORM の型が UseCase に漏れ出すことを防ぎます。

#### Schema と Migration

Drizzle の schema file は `src/infrastructure/psql/drizzle/schemas` に、生成された SQL migration は `src/infrastructure/psql/migrations` に置きます。

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
> PGlite は PostgreSQL 互換の database として扱えるため、SQL migration を schema の履歴とすれば、ローカルの組み込み storage と将来の PostgreSQL deployment で同じ履歴を共有できます。

#### Transaction Adapter

`DrizzleTransactionManager` は、具象の Drizzle transaction を domain レベルの `TransactionContext` の内側に隠します。

```ts
export class DrizzleTransactionManager implements TransactionManager {
  async runInTransaction<T>(operation: (ctx: TransactionContext) => Promise<T>): Promise<T> {
    await this.ready;

    return this.db.transaction((tx) => operation(new DrizzleTransactionContext(tx)));
  }
}
```

> [!TIP]
> UseCase は Drizzle の型を import することなく、transaction の意図を表現できます。具象の transaction を取り出すのは、Infrastructure Layer 内の Repository 実装だけです。

### API Documentation

API ドキュメントは独立した workspace app として切り出しています。`apps/api-doc` は Scalar UI と `/openapi.json` を提供し、OpenAPI document を `packages/contract` から生成します。

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
> API ドキュメントは app として起動・テストできますが、API 定義そのものは所有しません。backend が使う contract と同じものから、常に生成できます。

### Monorepo Tooling

この repository は Bun workspaces と Turborepo を使います。

各 package の script が build・type check・test を担い、root の script が Turbo 経由で全体を実行します。

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

共有 TypeScript 設定は `packages/typescript-config` に置き、各 workspace package から参照します。

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
> 各 package が自分に必要な command を持ちつつ、root では Turbo の cache と workspace graph に基づいて全体を検証できます。TypeScript 設定は app ごとにコピーするのではなく、workspace package として version 管理します。

### Code Quality

Oxlint と Oxfmt を使います。

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
> lint と format が速いほど、ローカル開発と CI の両方で気軽に、かつ頻繁に検証できます。

### Supply Chain Safety

依存関係の更新は保守的に扱います。

`bunfig.toml` で `minimumReleaseAge` を7日間に設定しています。

```toml
[install]
minimumReleaseAge = 604800
```

`.ncurc.json` でも npm-check-updates に7日間の cooldown と exact version を設定しています。

```json
{
  "cooldown": 7,
  "removeRange": true,
  "format": ["group"],
  "peer": true
}
```

> [!TIP]
> 公開直後の package version をすぐに取り込まないことで、短期間だけ出回る悪意ある release への露出を減らせます。exact version にしておくと、dependency の diff や audit の判断もしやすくなります。

### CI

GitHub Actions は `main` と `develop` への push、および pull request で実行されます。

```yaml
- name: Install dependencies
  run: bun install --frozen-lockfile

- name: Audit dependencies
  run: bun audit --audit-level high

- name: Run tests and checks
  run: bun turbo run type-check test quality --cache-dir="$HOME/.cache/turbo"
```

> [!TIP]
> 共有 branch に変更が入る前に、code・dependency・workflow の設定をまとめて検証できます。

## REST API

Todo を作成します。

```sh
curl --location --request POST "http://localhost:3000/todos" \
  --header "Content-Type: application/json" \
  --data-raw '{
    "title": "Implement DDD architecture",
    "description": "Create a sample application using Hono and oRPC"
  }'
```

Todo 一覧を取得します。

```sh
curl --location "http://localhost:3000/todos"
```

Todo を取得します。

```sh
curl --location "http://localhost:3000/todos/550e8400-e29b-41d4-a716-446655440000"
```

Todo を開始します。

```sh
curl --location --request POST "http://localhost:3000/todos/550e8400-e29b-41d4-a716-446655440000/start"
```

Todo を完了します。

```sh
curl --location --request POST "http://localhost:3000/todos/550e8400-e29b-41d4-a716-446655440000/complete"
```

Todo を更新します。

```sh
curl --location --request PATCH "http://localhost:3000/todos/550e8400-e29b-41d4-a716-446655440000" \
  --header "Content-Type: application/json" \
  --data-raw '{
    "title": "Updated title",
    "description": "Updated description"
  }'
```

Todo を削除します。

```sh
curl --location --request DELETE "http://localhost:3000/todos/550e8400-e29b-41d4-a716-446655440000"
```

## 開発

test を実行します。

```sh
bun run test
```

type check を実行します。

```sh
bun run type-check
```

lint を実行します。

```sh
bun run lint
```

format check を実行します。

```sh
bun run format
```

schema file を編集したあと、Drizzle の migration を生成します。

```sh
bun --cwd apps/backend run db:generate
```

ローカルの PGlite data directory に migration を適用します。

```sh
PGLITE_DATA_DIR=./.pglite bun --cwd apps/backend run db:migrate
```

自動修正を実行します。

```sh
bun run fix
```

## 関連リポジトリ

- [iktakahiro/dddpy](https://github.com/iktakahiro/dddpy): Python による DDD / Onion Architecture の実装例
- [iktakahiro/oniongo](https://github.com/iktakahiro/oniongo): Go による DDD / Onion Architecture の実装例

## ライセンス

このプロジェクトは MIT License のもとで公開されています。詳細は [LICENSE](LICENSE) を参照してください。
