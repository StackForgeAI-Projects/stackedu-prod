CREATE TABLE IF NOT EXISTS "course_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_offering_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"sequence" integer DEFAULT 0 NOT NULL,
	"prerequisite_module_id" uuid,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_material_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"first_viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN IF NOT EXISTS "module_id" uuid;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN IF NOT EXISTS "body_text" text;--> statement-breakpoint
ALTER TABLE "course_materials" ADD COLUMN IF NOT EXISTS "sequence" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_offering_id_course_offerings_id_fk" FOREIGN KEY ("course_offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_prerequisite_module_id_course_modules_id_fk" FOREIGN KEY ("prerequisite_module_id") REFERENCES "public"."course_modules"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_material_views" ADD CONSTRAINT "course_material_views_material_id_course_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."course_materials"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_material_views" ADD CONSTRAINT "course_material_views_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_module_id_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_modules"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_modules_offering_idx" ON "course_modules" USING btree ("course_offering_id","sequence");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_modules_prerequisite_idx" ON "course_modules" USING btree ("prerequisite_module_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_materials_module_idx" ON "course_materials" USING btree ("module_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "course_material_views_key" ON "course_material_views" USING btree ("material_id","student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_material_views_student_idx" ON "course_material_views" USING btree ("student_id");
