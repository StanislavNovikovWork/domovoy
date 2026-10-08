CREATE TABLE "budget_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"month" date NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_plan_amount_positive" CHECK ("budget_plan"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "budget_plan" ADD CONSTRAINT "budget_plan_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_plan" ADD CONSTRAINT "budget_plan_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "budget_plan_category_month_idx" ON "budget_plan" USING btree ("category_id","month");--> statement-breakpoint
CREATE INDEX "budget_plan_household_month_idx" ON "budget_plan" USING btree ("household_id","month");