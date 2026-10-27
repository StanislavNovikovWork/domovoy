CREATE TABLE "app_changelog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"released_on" date NOT NULL,
	"items" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_changelog_version_unique" UNIQUE("version")
);
