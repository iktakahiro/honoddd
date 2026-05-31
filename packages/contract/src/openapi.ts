import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";

import { contract } from "./contract";

/**
 * Options for generating the OpenAPI document.
 */
export type CreateOpenAPISpecOptions = {
  servers?: Array<{
    description?: string;
    url: string;
  }>;
};

/**
 * Generates an OpenAPI document from the shared oRPC contract.
 *
 * @param options - Optional OpenAPI generation settings.
 *
 * @returns OpenAPI document for the Todo API.
 */
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
    tags: [
      {
        name: "Todo",
      },
    ],
  });
}
