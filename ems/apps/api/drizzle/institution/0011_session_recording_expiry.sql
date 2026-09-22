ALTER TABLE "session_recordings" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "session_recordings" ADD COLUMN IF NOT EXISTS "expiry_reminder_sent_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "session_recordings" ADD COLUMN IF NOT EXISTS "purged_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_recordings_expiry_idx" ON "session_recordings" ("expires_at");
