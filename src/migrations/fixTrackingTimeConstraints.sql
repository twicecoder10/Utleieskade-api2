-- Fix TrackingTime table constraints and add missing columns
-- This migration fixes the trackingTimeEnd NOT NULL constraint issue and adds caseId column

-- 1. Allow trackingTimeEnd to be NULL (when starting a timer, it should be NULL)
ALTER TABLE "TrackingTime" 
ALTER COLUMN "trackingTimeEnd" DROP NOT NULL;

-- 2. Add caseId column if it doesn't exist (to link timer sessions to specific cases)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TrackingTime' AND column_name = 'caseId'
    ) THEN
        ALTER TABLE "TrackingTime" ADD COLUMN "caseId" VARCHAR(255);
    END IF;
END $$;

-- 3. Add isActive column if it doesn't exist (to track if timer is currently running)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TrackingTime' AND column_name = 'isActive'
    ) THEN
        ALTER TABLE "TrackingTime" ADD COLUMN "isActive" BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. If userId column exists but is not being used, we can leave it as nullable
-- (The model doesn't include userId, so if it's needed, it should be added to the model)
-- If you want to remove the userId column (if not needed), uncomment the line below:
-- ALTER TABLE "TrackingTime" DROP COLUMN IF EXISTS "userId";

