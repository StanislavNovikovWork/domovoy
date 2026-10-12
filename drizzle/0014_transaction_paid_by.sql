ALTER TABLE "transaction" ADD COLUMN "paid_by_user_id" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "paid_by_name" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_paid_by_user_id_user_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;