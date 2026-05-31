# honoddd

Hono、oRPC、TypeScript による DDD と Onion Architecture の実践的なリファレンス実装

[English](README.md) | 日本語

**注意**: このリポジトリは、小さな Web API を DDD と Onion Architecture で構成する方法を示すためのサンプルです。本番環境に適用する場合は、認証、認可、監視、マイグレーション管理、運用上のセキュリティを追加してください。

このプロジェクトは [iktakahiro/dddpy](https://github.com/iktakahiro/dddpy) に着想を得ています。同じアーキテクチャ上の考え方を、Bun、Hono、oRPC、TypeScript、Drizzle、PGlite のスタックで実装しています。

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

backend API を起動します。

```sh
bun run dev:backend
```

API ドキュメントを起動します。

```sh
bun run dev:api-doc
```

全体の検証を実行します。

```sh
bun run validate
```

backend はデフォルトで `http://localhost:3000` です。
API ドキュメントはデフォルトで `http://localhost:3001` です。

## Workspace

- `apps/backend`: oRPC handler と Drizzle/PGlite を使った Hono REST API
- `apps/api-doc`: 共有 oRPC contract から生成する Scalar API リファレンス
- `packages/contract`: oRPC contract、Zod schema、OpenAPI 生成
- `packages/typescript-config`: workspace 共通の TypeScript 設定

## ソフトウェアアーキテクチャ

backend は Onion Architecture に基づいています。内側のレイヤーではビジネス概念とアプリケーションの振る舞いを表現し、外側のレイヤーでは HTTP、OpenAPI、PostgreSQL 互換の永続化に適応します。

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
|           |-- infrastructure
|           |   `-- drizzle
|           |       |-- drizzle-database.ts
|           |       |-- drizzle-transaction.ts
|           |       `-- todo
|           |           |-- todo-schema.ts
|           |           `-- repositories
|           |               |-- drizzle-todo-repository.ts
|           |               `-- todo-mapper.ts
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

Domain Layer には、Entity、Value Object、Domain Exception、Repository Interface を置きます。

**なにをしているか**: `Todo` は一意な `TodoId`、ライフサイクル状態、`start` や `complete` といった振る舞いを持つ Entity として実装しています。

**なぜそうするか**: ライフサイクルのルールを Entity の近くに置くことで、HTTP handler や repository に状態遷移のルールが散らばることを避けられます。UseCase は Entity に状態変更を依頼できます。

**なにをしているか**: 単一値の ID は `makeIdVO` で作る branded type として表現し、`TodoTitle` や `TodoDescription` のような Value Object は自身の制約を検証します。

**なぜそうするか**: branded ID によって、単なる文字列を誤って domain ID として扱うリスクを下げます。Value Object に検証を持たせることで、domain の境界で値の正しさを明示できます。

**なにをしているか**: `TodoRepository` は domain layer に定義し、Drizzle による具象実装は infrastructure layer に置いています。

**なぜそうするか**: UseCase が必要としているのは Todo を永続化する能力であり、Drizzle、PGlite、SQL、テーブル構造そのものではありません。依存方向を内側に保てます。

### Application Layer

Application Layer には、アプリケーションの操作単位で UseCase を置きます。

**なにをしているか**: `create-todo-usecase.ts` のようなファイル名で、1つの UseCase class に1つの public `execute` method を持たせています。

**なぜそうするか**: UseCase はアプリケーションのトランザクション境界です。1つの public action に絞ることで、ポリシー、バリデーション判断、永続化の呼び出しを読みやすく保てます。大きな service object に育つことも避けやすくなります。

**なにをしているか**: UseCase は入力を domain の Value Object に変換し、Repository Interface から Entity を取得し、Entity の振る舞いを呼び出して保存します。

**なぜそうするか**: orchestration は Application Layer、domain rule は Domain Layer、database detail は Infrastructure Layer に分けられます。

**なにをしているか**: UseCase は `TransactionManager` に依存し、atomic に扱いたい database operation を `runInTransaction` で明示的に囲みます。

**なぜそうするか**: transaction は常に HTTP request 全体と一致するとは限りません。UseCase の中では外部サービスを呼んだり、LLM/API の応答を待ったり、database write の前後に時間のかかる処理を行うことがあります。transaction 範囲を UseCase 内で制御すると、transaction を短く保ちつつ、同時に commit/rollback したい状態変更だけを正確に囲めます。

### Contract Package

Contract package には API route、request schema、response schema、OpenAPI 生成を置きます。

**なにをしているか**: `packages/contract` が oRPC contract と Zod schema を所有します。`apps/backend` はその contract を実装し、`apps/api-doc` は同じ contract から API ドキュメントを生成します。

**なぜそうするか**: API contract が backend と frontend の間で共有される成果物になります。将来 frontend を追加するときも、endpoint path や payload type を再定義せずに同じ contract を使えます。

**なにをしているか**: OpenAPI は contract から生成します。

**なぜそうするか**: API ドキュメントが実行される interface の近くに置かれます。API の振る舞いとリファレンスの乖離を減らせます。

### API Layer

API Layer では Hono と oRPC を使い、HTTP request を UseCase 呼び出しへ変換します。

**なにをしているか**: `apps/backend/src/api/app.ts` は Hono app を構築し、composition root から repository dependency を受け取ります。

**なぜそうするか**: API Layer を薄く保てます。Todo をどう永続化するかを API Layer が決めず、test でも明示的な repository を渡せます。

**なにをしているか**: `orpc-router.ts` は contract handler と UseCase を対応させ、Domain Exception を oRPC error に変換します。

**なぜそうするか**: error mapping は adapter の責務です。Domain や Application の code は HTTP status code や response format に依存せず、意味のある例外を投げられます。

### Infrastructure Layer

Infrastructure Layer には Drizzle、PGlite、schema definition、mapper を置きます。

**なにをしているか**: `DrizzleTodoRepository` は Drizzle ORM と PGlite を使って `TodoRepository` を実装します。

**なぜそうするか**: PGlite により、このリファレンス実装では外部 database server なしで PostgreSQL 互換の振る舞いを得られます。Drizzle は table access を型付けしつつ、database 固有の詳細を Infrastructure Layer に閉じ込められます。

**なにをしているか**: `DrizzleTransactionManager` は Drizzle transaction を infrastructure 非依存の `TransactionContext` で包みます。

**なぜそうするか**: UseCase は Drizzle の型を import せずに transaction の意図を表現できます。一方で、Repository 実装は必要なときに context から具象の Drizzle transaction を取り出して SQL を実行できます。

**なにをしているか**: `todo-schema.ts` が database table を定義し、`todo-mapper.ts` が Drizzle row と `Todo` entity を相互変換します。

**なぜそうするか**: database row は domain object ではありません。明示的な mapper によって、column name、nullable field、ORM の型が UseCase に漏れることを防ぎます。

### API Documentation

API ドキュメントは独立した workspace app にしています。

**なにをしているか**: `apps/api-doc` は Scalar UI と `/openapi.json` を提供し、OpenAPI document は `packages/contract` から生成します。

**なぜそうするか**: API ドキュメントは app として起動、テストできますが、API 定義そのものは所有しません。backend が使う contract と同じものから常に生成できます。

### Monorepo Tooling

この repository は Bun workspaces と Turborepo を使います。

**なにをしているか**: 各 package の script が build、type check、test を持ち、root script が Turbo 経由で全体を実行します。

**なぜそうするか**: 各 package が自分に必要な command を持ちながら、root では workspace 全体を graph と cache に基づいて一貫して検証できます。

**なにをしているか**: 共有 TypeScript 設定を `packages/typescript-config` に置いています。

**なぜそうするか**: TypeScript の設定を workspace package として version 管理できます。app や package は root の設定ファイルをコピーせず、同じ base config を extend できます。

### Code Quality

Oxlint と Oxfmt を使います。

**なにをしているか**: root から `bun run lint`、`bun run format`、`bun run check` を実行できます。

**なぜそうするか**: lint と format が速いほど、local development と CI の両方で頻繁に検証しやすくなります。

### Supply Chain Safety

依存関係の更新は保守的に扱います。

**なにをしているか**: `bunfig.toml` で `minimumReleaseAge` を7日間に設定し、`.ncurc.json` でも npm-check-updates に7日間の cooldown と exact version を設定しています。

**なぜそうするか**: 公開直後の package version をすぐに入れないことで、短期間だけ存在する悪意ある release への露出を減らします。exact version は diff と audit の判断もしやすくします。

### CI

GitHub Actions は `main` と `develop` への push、および pull request で実行されます。

**なにをしているか**: CI は frozen lockfile で install し、dependency audit、Turbo cache restore、type check、test、quality check、zizmor による workflow scan を実行します。

**なぜそうするか**: shared branch に変更が入る前に、code、dependency、workflow configuration をまとめて検証できます。

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

自動修正を実行します。

```sh
bun run fix
```

## ライセンス

このプロジェクトは MIT License のもとで公開されています。詳細は [LICENSE](LICENSE) を参照してください。
