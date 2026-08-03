CREATE TABLE "password_reset_email_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" varchar(32) NOT NULL,
	"email" varchar(255) NOT NULL,
	"encrypted_code" text,
	"code_expires_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone NOT NULL,
	"locked_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "password_reset_email_jobs_pending_idx" ON "password_reset_email_jobs" USING btree ("available_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "refresh_sessions_expires_at_idx" ON "refresh_sessions" USING btree ("expires_at" timestamptz_ops);