ALTER TABLE "timetable_slots" ADD COLUMN IF NOT EXISTS "availability_status" text DEFAULT 'Confirmed' NOT NULL;
ALTER TABLE "timetable_slots" ADD COLUMN IF NOT EXISTS "change_reason" text;
ALTER TABLE "timetable_slots" ADD COLUMN IF NOT EXISTS "confirmed_at" timestamp with time zone;
