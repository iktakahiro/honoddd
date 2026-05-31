import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dbCredentials: {
    url: process.env.PGLITE_DATA_DIR ?? "./.pglite",
  },
  dialect: "postgresql",
  driver: "pglite",
  out: "./src/infrastructure/psql/migrations",
  schema: "./src/infrastructure/psql/drizzle/schemas/*.ts",
  strict: true,
  verbose: true,
});
