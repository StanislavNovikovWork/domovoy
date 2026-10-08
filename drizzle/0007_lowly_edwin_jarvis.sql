CREATE TABLE "budget_plan_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"name" text NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_plan_item_amount_positive" CHECK ("budget_plan_item"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "budget_plan_item" ADD CONSTRAINT "budget_plan_item_plan_id_budget_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."budget_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "budget_plan_item_name_idx" ON "budget_plan_item" USING btree ("plan_id",lower("name"));