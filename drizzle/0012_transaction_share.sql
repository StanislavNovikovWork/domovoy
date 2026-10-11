CREATE TABLE "transaction_share" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"amount" bigint NOT NULL,
	CONSTRAINT "transaction_share_amount_positive" CHECK ("transaction_share"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "transaction_share" ADD CONSTRAINT "transaction_share_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_share" ADD CONSTRAINT "transaction_share_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transaction_share_tx_idx" ON "transaction_share" USING btree ("transaction_id");