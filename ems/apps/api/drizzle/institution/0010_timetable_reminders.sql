CREATE TABLE IF NOT EXISTS "timetable_reminders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
  "timetable_slot_id" uuid NOT NULL REFERENCES "timetable_slots"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "notes" text,
  "minutes_before" integer NOT NULL,
  "next_fire_at" timestamp with time zone NOT NULL,
  "last_sent_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "timetable_reminders_student_slot_key" ON "timetable_reminders" ("student_id", "timetable_slot_id");
CREATE INDEX IF NOT EXISTS "timetable_reminders_fire_idx" ON "timetable_reminders" ("next_fire_at");
