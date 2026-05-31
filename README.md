# honoddd

A Practical Reference Implementation of DDD & Onion Architecture with Hono, oRPC, and TypeScript

English | [日本語](README.ja_JP.md)

**NOTE**: This repository demonstrates how to structure a small web API with DDD and Onion Architecture. Before adapting it to production, add authentication, authorization, observability, migration management, and operational security for your own environment.

This project is inspired by [iktakahiro/dddpy](https://github.com/iktakahiro/dddpy) and translates the same architectural ideas into a Bun, Hono, oRPC, TypeScript, Drizzle, and PGlite stack.

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

Run the backend API:

```sh
bun run dev:backend
```

Run the API documentation app:

```sh
bun run dev:api-doc
```

Run all validation tasks:

```sh
bun run validate
```

The backend defaults to `http://localhost:3000`.
The API docs default to `http://localhost:3001`.

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

## Implemented Practices

### Domain Layer

The domain layer contains entities, value objects, domain exceptions, and repository interfaces.

**What**: `Todo` is modeled as an entity with a unique `TodoId`, lifecycle state, and behavior such as `start` and `complete`.

**Why**: Entity methods keep lifecycle rules near the data they protect. A use case can ask the entity to change state instead of spreading status transition rules across HTTP handlers or repositories.

**What**: Single-value identifiers use branded types created by `makeIdVO`, and value objects such as `TodoTitle` and `TodoDescription` validate their own constraints.

**Why**: Branded IDs make it harder to accidentally pass an arbitrary string where a domain ID is expected. Value objects also make validation reusable and explicit at the domain boundary.

**What**: `TodoRepository` is defined in the domain layer, while its concrete Drizzle implementation lives in infrastructure.

**Why**: Use cases depend on the capability to persist todos, not on Drizzle, PGlite, SQL, or a particular table shape. This keeps the dependency direction pointing inward.

### Application Layer

The application layer contains one use case class per application action.

**What**: Files follow names such as `create-todo-usecase.ts`, and each class exposes a single public `execute` method.

**Why**: A use case is an application transaction boundary. Keeping one public action per class makes policies, validation decisions, and persistence calls easier to read, test, and change without growing a broad service object.

**What**: Use cases parse input into domain value objects, load entities through repository interfaces, invoke entity behavior, and save the result.

**Why**: This keeps orchestration in the application layer while leaving domain rules in the domain layer and database details in infrastructure.

**What**: Use cases depend on `TransactionManager` and explicitly call `runInTransaction` around the database work they want to make atomic.

**Why**: A transaction is an application boundary, not always an HTTP request boundary. Some use cases may call external services, wait for an LLM/API response, or perform slow work before or after database writes. Controlling the transaction inside the use case lets the code keep transactions short and place them exactly around the state changes that must commit or roll back together.

### Contract Package

The contract package defines API routes, request schemas, response schemas, and OpenAPI generation.

**What**: `packages/contract` owns the oRPC contract and Zod schemas. `apps/backend` implements that contract, and `apps/api-doc` reads it to generate API documentation.

**Why**: The API contract becomes a shared artifact instead of duplicated backend and frontend types. As the project grows, a frontend can consume the same contract without re-declaring endpoint paths and payloads.

**What**: OpenAPI is generated from the contract.

**Why**: Documentation stays close to the executable interface. This reduces drift between API behavior and API reference pages.

### API Layer

The API layer uses Hono and oRPC to translate HTTP requests into use case calls.

**What**: `apps/backend/src/api/app.ts` constructs the Hono app and receives the repository dependency from the composition root.

**Why**: The API layer stays thin. It does not decide how todos are persisted, and tests can create the app with an explicit repository.

**What**: `orpc-router.ts` maps contract handlers to use cases and translates domain exceptions into oRPC errors.

**Why**: Error mapping is an adapter concern. Domain and application code can throw meaningful exceptions without depending on HTTP status codes or response formats.

### Infrastructure Layer

The infrastructure layer contains Drizzle, PGlite, schema definitions, and mappers.

**What**: `DrizzleTodoRepository` implements `TodoRepository` using Drizzle ORM and PGlite.

**Why**: PGlite gives the repository PostgreSQL-compatible behavior without requiring a separate database server for this reference implementation. Drizzle keeps SQL table access typed while still making database-specific details visible in infrastructure.

**What**: `DrizzleTransactionManager` wraps Drizzle transactions in an infrastructure-agnostic `TransactionContext`.

**Why**: Use cases can express transactional intent without importing Drizzle types. Repository implementations can still recover the concrete Drizzle transaction from the context when they need to execute SQL.

**What**: `todo-schema.ts` defines the database table, and `todo-mapper.ts` converts between Drizzle rows and the `Todo` entity.

**Why**: Database rows are not domain objects. Explicit mappers prevent column names, nullable database fields, and ORM types from leaking into use cases.

### API Documentation

The API documentation app is a separate workspace app.

**What**: `apps/api-doc` serves Scalar UI and `/openapi.json` from `packages/contract`.

**Why**: API documentation is deployed and tested as an app, but it does not own API definitions. The docs are always generated from the same contract used by the backend.

### Monorepo Tooling

This repository uses Bun workspaces and Turborepo.

**What**: Package-local scripts run builds, type checks, and tests, while root scripts orchestrate them through Turbo.

**Why**: Each package owns the commands that make sense for it, and the root can validate the whole graph consistently with caching.

**What**: Shared TypeScript settings live in `packages/typescript-config`.

**Why**: TypeScript options are versioned as a workspace package. Apps and packages can extend the same base config without copying root-level files.

### Code Quality

The repository uses Oxlint and Oxfmt.

**What**: `bun run lint`, `bun run format`, and `bun run check` are available from the root.

**Why**: Fast linting and formatting reduce friction enough that checks can run frequently in local development and CI.

### Supply Chain Safety

Dependency updates are intentionally conservative.

**What**: `bunfig.toml` sets `minimumReleaseAge` to seven days, and `.ncurc.json` configures npm-check-updates with a seven-day cooldown and exact versions.

**Why**: Waiting before installing freshly published package versions reduces exposure to short-lived malicious releases. Exact dependency versions also make diffs and audits easier to reason about.

### CI

GitHub Actions runs checks on pushes to `main` and `develop`, and on pull requests.

**What**: CI installs with a frozen lockfile, audits dependencies, restores Turbo cache, runs type checks, tests, and quality checks, and scans workflows with zizmor.

**Why**: The project validates code, dependencies, and workflow configuration before changes are merged or pushed to shared branches.

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

Apply automatic fixes:

```sh
bun run fix
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
