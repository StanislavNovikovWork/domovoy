CREATE TYPE "public"."household_kind" AS ENUM('periodic', 'one_time');--> statement-breakpoint
ALTER TABLE "household" ADD COLUMN "kind" "household_kind" DEFAULT 'periodic' NOT NULL;