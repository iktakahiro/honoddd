import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";

import { contract } from "./contract";

export type CreateOpenAPISpecOptions = {
  servers?: Array<{
    description?: string;
    url: string;
  }>;
};

export async function createOpenAPISpec(options: CreateOpenAPISpecOptions = {}) {
  const generator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  });

  return generator.generate(contract, {
    info: {
      description:
        "A Hono, TypeScript, and oRPC REST API example following DDD and Onion Architecture boundaries.",
      title: "Hono DDD Todo API",
      version: "0.1.0",
    },
    servers: options.servers ?? [
      {
        description: "Local backend",
        url: "http://localhost:3000",
      },
    ],
  });
}
