-- Fix TrackingTime table constraints
-- This migration fixes the trackingTimeEnd NOT NULL constraint issue

-- 1. Allow trackingTimeEnd to be NULL (when starting a timer, it should be NULL)
ALTER TABLE "TrackingTime" 
ALTER COLUMN "trackingTimeEnd" DROP NOT NULL;

-- 2. If userId column exists but is not being used, we can leave it as nullable
-- (The model doesn't include userId, so if it's needed, it should be added to the model)
-- If you want to remove the userId column (if not needed), uncomment the line below:
-- ALTER TABLE "TrackingTime" DROP COLUMN IF EXISTS "userId";

