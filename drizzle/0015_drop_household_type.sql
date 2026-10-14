DROP INDEX "household_one_personal_per_user";--> statement-breakpoint
ALTER TABLE "household" DROP COLUMN "type";--> statement-breakpoint
DROP TYPE "public"."household_type";