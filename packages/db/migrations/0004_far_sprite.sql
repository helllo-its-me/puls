ALTER TABLE "refresh_sessions" ADD COLUMN "family_id" text;--> statement-breakpoint
UPDATE "refresh_sessions" SET "family_id" = "id" WHERE "family_id" IS NULL;--> statement-breakpoint
ALTER TABLE "refresh_sessions" ALTER COLUMN "family_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "password_reset_codes_expires_at_idx" ON "password_reset_codes" USING btree ("expires_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "password_reset_codes_token_expires_at_idx" ON "password_reset_codes" USING btree ("reset_token_expires_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "refresh_sessions_family_id_idx" ON "refresh_sessions" USING btree ("family_id" text_ops);
