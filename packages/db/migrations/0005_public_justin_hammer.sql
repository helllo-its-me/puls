CREATE TABLE "refresh_session_families" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
INSERT INTO "refresh_session_families" ("id", "user_id", "expires_at", "revoked_at", "created_at")
SELECT "family_id", "user_id", MAX("expires_at"), MAX("revoked_at"), MIN("created_at")
FROM "refresh_sessions"
GROUP BY "family_id", "user_id";--> statement-breakpoint
ALTER TABLE "refresh_session_families" ADD CONSTRAINT "refresh_session_families_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "refresh_session_families_expires_at_idx" ON "refresh_session_families" USING btree ("expires_at" timestamptz_ops);--> statement-breakpoint
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_family_id_refresh_session_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."refresh_session_families"("id") ON DELETE cascade ON UPDATE no action;
