-- Migration: Add 'inspectorPercentage' to PlatformSettings table
-- This field determines what percentage of case cost goes to inspectors

DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'PlatformSettings' 
        AND column_name = 'inspectorPercentage'
    ) THEN
        -- Add the column
        ALTER TABLE "PlatformSettings" 
        ADD COLUMN "inspectorPercentage" DECIMAL(5, 2) NOT NULL DEFAULT 40.0;
        
        RAISE NOTICE 'Added ''inspectorPercentage'' column to PlatformSettings';
    ELSE
        RAISE NOTICE '''inspectorPercentage'' column already exists in PlatformSettings';
    END IF;
END $$;

-- Update existing records with default value if needed
UPDATE "PlatformSettings" 
SET "inspectorPercentage" = 40.0 
WHERE "inspectorPercentage" IS NULL;

