CREATE TABLE "registration_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"registration_token_hash" text NOT NULL,
	"user_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"code_hash" text NOT NULL,
	"encrypted_code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "registration_attempts_registration_token_hash_unique" UNIQUE("registration_token_hash")
);
--> statement-breakpoint
ALTER TABLE "password_reset_codes" ADD COLUMN "encrypted_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
UPDATE "users" SET "email_verified_at" = "created_at" WHERE "email_verified_at" IS NULL;--> statement-breakpoint
CREATE INDEX "registration_attempts_email_idx" ON "registration_attempts" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "registration_attempts_expires_at_idx" ON "registration_attempts" USING btree ("expires_at" timestamptz_ops);
