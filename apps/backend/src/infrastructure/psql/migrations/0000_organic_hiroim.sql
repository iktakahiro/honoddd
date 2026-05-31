CREATE TYPE "public"."todo_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TABLE "todos" (
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"description" text,
	"id" text PRIMARY KEY NOT NULL,
	"status" "todo_status" NOT NULL,
	"title" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "todos_status_idx" ON "todos" USING btree ("status");