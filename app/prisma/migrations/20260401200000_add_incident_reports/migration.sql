-- Add EU Database ID to AI systems
ALTER TABLE "ai_systems" ADD COLUMN "eu_database_id" TEXT;

-- Add incident type to incidents
ALTER TABLE "incidents" ADD COLUMN "incident_type" TEXT;

-- Create incident reports table
CREATE TABLE "incident_reports" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "report_number" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "submitted_to" TEXT,
    "submitted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_reports_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX "incident_reports_incident_id_report_type_idx" ON "incident_reports"("incident_id", "report_type");

-- Add foreign keys
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
