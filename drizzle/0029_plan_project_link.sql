CREATE TABLE "plan_project_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_item_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"member_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"guest_names" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan_project_link" ADD CONSTRAINT "plan_project_link_plan_item_id_budget_plan_item_id_fk" FOREIGN KEY ("plan_item_id") REFERENCES "public"."budget_plan_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_project_link" ADD CONSTRAINT "plan_project_link_project_id_household_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_project_link" ADD CONSTRAINT "plan_project_link_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_project_link" ADD CONSTRAINT "plan_project_link_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plan_project_link_item_idx" ON "plan_project_link" USING btree ("plan_item_id");--> statement-breakpoint
CREATE INDEX "plan_project_link_household_idx" ON "plan_project_link" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "plan_project_link_project_idx" ON "plan_project_link" USING btree ("project_id");