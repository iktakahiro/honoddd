# honoddd

Hono, TypeScript, Bun, Turborepo example repository inspired by `iktakahiro/dddpy`.

## Workspace

- `apps/backend`: Hono REST API backed by oRPC OpenAPI handler.
- `apps/api-doc`: Scalar API reference app generated from the shared contract.
- `packages/contract`: oRPC contract, Zod schemas, and OpenAPI generation.

## Commands

```sh
bun install
bun run dev:backend
bun run dev:api-doc
bun run check
```

Backend defaults to `http://localhost:3000`.
API docs default to `http://localhost:3001`.
