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
    expect(spec.paths?.["/todos/{id}/start"]?.post).toBeDefined();
    expect(spec.paths?.["/todos/{id}/complete"]?.post).toBeDefined();
    expect(spec.paths?.["/todos"]?.post?.tags).toEqual(["Todo"]);
    expect(spec.tags).toEqual([{ name: "Todo" }]);

    const createTodoResponse = spec.paths?.["/todos"]?.post?.responses["201"];

    if (createTodoResponse === undefined || !("content" in createTodoResponse)) {
      throw new Error("Expected create todo response content");
    }

    const createTodoSchema = createTodoResponse.content?.["application/json"]?.schema;

    if (createTodoSchema === undefined || !("properties" in createTodoSchema)) {
      throw new Error("Expected create todo response schema properties");
    }

    expect(Object.keys(createTodoSchema.properties ?? {})).toEqual([
      "id",
      "title",
      "description",
      "status",
      "completedAt",
      "createdAt",
      "updatedAt",
    ]);
  });
});
