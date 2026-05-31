import { describe, expect, it } from "bun:test";

import { createOpenAPISpec } from "./openapi";

describe("createOpenAPISpec", () => {
  it("generates the Todo REST paths from the contract", async () => {
    const spec = await createOpenAPISpec();

    expect(spec.paths).toBeDefined();
    expect(spec.paths?.["/todos"]?.get).toBeDefined();
    expect(spec.paths?.["/todos"]?.post).toBeDefined();
    expect(spec.paths?.["/todos/{id}"]?.get).toBeDefined();
    expect(spec.paths?.["/todos/{id}"]?.patch).toBeDefined();
    expect(spec.paths?.["/todos/{id}"]?.delete).toBeDefined();
  });
});
