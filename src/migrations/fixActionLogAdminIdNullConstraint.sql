-- Fix ActionLog to support both admin and inspector actions
-- This migration makes both adminId and inspectorId nullable, allowing the table
-- to track actions from both admins and inspectors

-- Make adminId nullable (it may have a NOT NULL constraint)
DO $$
BEGIN
    -- Check if column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ActionLog' 
        AND column_name = 'adminId'
    ) THEN
        -- Make adminId nullable if it exists
        ALTER TABLE "ActionLog" 
        ALTER COLUMN "adminId" DROP NOT NULL;
        
        RAISE NOTICE '✅ Made adminId column nullable in ActionLog table';
    ELSE
        -- If column doesn't exist, add it as nullable
        ALTER TABLE "ActionLog" 
        ADD COLUMN "adminId" VARCHAR(255) NULL;
        
        RAISE NOTICE '✅ Added adminId column as nullable to ActionLog table';
    END IF;
END $$;

-- Ensure inspectorId is nullable (should already be, but just in case)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ActionLog' 
        AND column_name = 'inspectorId'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "ActionLog" 
        ALTER COLUMN "inspectorId" DROP NOT NULL;
        
        RAISE NOTICE '✅ Made inspectorId column nullable in ActionLog table';
    END IF;
END $$;

-- Add check constraint: at least one of adminId or inspectorId must be set
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ActionLog_adminId_or_inspectorId_check'
    ) THEN
        ALTER TABLE "ActionLog" 
        DROP CONSTRAINT "ActionLog_adminId_or_inspectorId_check";
    END IF;
    
    -- Add new constraint
    ALTER TABLE "ActionLog" 
    ADD CONSTRAINT "ActionLog_adminId_or_inspectorId_check" 
    CHECK (("adminId" IS NOT NULL) OR ("inspectorId" IS NOT NULL));
    
    RAISE NOTICE '✅ Added check constraint: at least one of adminId or inspectorId must be set';
END $$;

-- Add index on adminId for faster queries
CREATE INDEX IF NOT EXISTS "ActionLog_adminId_idx" ON "ActionLog" ("adminId");

