CREATE TABLE "password_reset_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"reset_token_hash" text,
	"reset_token_expires_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_focus_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"label" varchar(255) NOT NULL,
	"progress_label" varchar(255) NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_highlights" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_quick_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"label" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"accent" varchar(32) NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"birth_date" date,
	"height_cm" integer,
	"weight_kg" integer,
	"gender" varchar(32),
	"membership_tier" varchar(255) NOT NULL,
	"plan_title" varchar(255) NOT NULL,
	"joined_at" timestamp with time zone NOT NULL,
	"next_session_at" timestamp with time zone NOT NULL,
	"streak_days" integer NOT NULL,
	"completion_percent" integer NOT NULL,
	"energy_label" varchar(255) NOT NULL,
	"consistency_note" text NOT NULL,
	"support_note" text NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "refresh_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "refresh_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "profile_focus_areas" ADD CONSTRAINT "profile_focus_areas_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_highlights" ADD CONSTRAINT "profile_highlights_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_quick_actions" ADD CONSTRAINT "profile_quick_actions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
