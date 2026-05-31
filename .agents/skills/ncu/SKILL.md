---
name: ncu
description: Check and update packages with npm-check-updates in this bun monorepo; use when the user asks to review or apply dependency updates.
---

# NCU Package Update

Use `--workspaces` in this monorepo. A bare `bunx ncu` only checks the root `package.json`.

## Steps

1. Run `bunx ncu --workspaces` to list available updates for the root package and all workspace packages.
2. If the user only asked to review updates, stop after summarizing the results by package.
3. If major updates are present, ask whether to proceed before updating.
4. Run `bunx ncu --workspaces -u` to update the root `package.json` and all workspace `package.json` files.
5. Run `bun install`.
6. Run `bun audit`.
7. Run `bun run check:fix`.
8. Run `bun run validate`.
9. Run `bun run test`.

If any command fails, stop and report the error output. If all succeed, report normal completion.

## Audit and supply-chain policy

- Do not bypass Bun's configured release-age protection. Never use `--minimum-release-age=0`, lower `minimumReleaseAge`, or otherwise disable the age gate while updating packages.
- If `bun audit` reports a vulnerability, first try fixes that still respect the configured age gate:
  - update the vulnerable direct dependency with normal `bun update`;
  - update the parent package with normal `bunx ncu --workspaces -u` / `bun install`;
  - add or adjust a root `overrides` entry only when the fixed version is allowed by the configured age gate.
- If the only patched version is blocked by `minimumReleaseAge`, stop and report:
  - the advisory and severity;
  - the dependency path;
  - the patched version;
  - that the patched version is blocked by the age gate.
- Do not force an audit workaround in that situation. Ask for a human policy decision instead.
