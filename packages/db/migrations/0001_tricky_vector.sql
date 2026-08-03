CREATE TABLE "auth_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"attempts" integer NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "auth_rate_limits_window_started_at_idx" ON "auth_rate_limits" USING btree ("window_started_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "password_reset_codes_email_idx" ON "password_reset_codes" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_codes_reset_token_hash_idx" ON "password_reset_codes" USING btree ("reset_token_hash" text_ops);
