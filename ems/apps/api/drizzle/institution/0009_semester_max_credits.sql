ALTER TABLE "semesters" ADD COLUMN IF NOT EXISTS "max_credits" integer DEFAULT 21 NOT NULL;
