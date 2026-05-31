import { describe, expect, it } from "bun:test";

import { createApp } from "./app";

describe("api-doc app", () => {
  it("serves an OpenAPI document from the shared contract", async () => {
    const app = createApp();
    const response = await app.request("/openapi.json");
    const spec = await response.json();

    expect(response.status).toBe(200);
    expect(spec.info.title).toBe("Hono DDD Todo API");
    expect(spec.paths["/todos"]).toBeDefined();
  });
});
