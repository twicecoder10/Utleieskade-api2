-- Create ActionLog table for tracking inspector actions
-- This migration creates the ActionLog table to store inspector action logs

CREATE TABLE IF NOT EXISTS "ActionLog" (
    "logId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "inspectorId" VARCHAR(255) NOT NULL,
    "actionType" VARCHAR(255) NOT NULL,
    "actionDescription" TEXT NOT NULL,
    "caseId" VARCHAR(255),
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index on inspectorId for faster queries
CREATE INDEX IF NOT EXISTS "ActionLog_inspectorId_idx" ON "ActionLog" ("inspectorId");

-- Add index on caseId for faster queries
CREATE INDEX IF NOT EXISTS "ActionLog_caseId_idx" ON "ActionLog" ("caseId");

-- Add index on actionType for faster filtering
CREATE INDEX IF NOT EXISTS "ActionLog_actionType_idx" ON "ActionLog" ("actionType");

-- Add index on createdAt for faster sorting
CREATE INDEX IF NOT EXISTS "ActionLog_createdAt_idx" ON "ActionLog" ("createdAt" DESC);

-- Add comments for documentation
COMMENT ON TABLE "ActionLog" IS 'Stores action logs for inspector activities';
COMMENT ON COLUMN "ActionLog"."logId" IS 'Primary key, UUID';
COMMENT ON COLUMN "ActionLog"."inspectorId" IS 'ID of the inspector who performed the action';
COMMENT ON COLUMN "ActionLog"."actionType" IS 'Type of action (e.g., case_claimed, case_cancelled, report_submitted)';
COMMENT ON COLUMN "ActionLog"."actionDescription" IS 'Description of the action performed';
COMMENT ON COLUMN "ActionLog"."caseId" IS 'Optional: ID of the case related to this action';
COMMENT ON COLUMN "ActionLog"."metadata" IS 'Optional: Additional metadata about the action in JSON format';
COMMENT ON COLUMN "ActionLog"."createdAt" IS 'Timestamp when the action was logged';
COMMENT ON COLUMN "ActionLog"."updatedAt" IS 'Timestamp when the log was last updated';

