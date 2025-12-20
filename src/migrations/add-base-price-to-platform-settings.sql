-- Migration: Add 'basePrice' to PlatformSettings table
-- This adds the basePrice field to allow admins to configure the base price per room.

-- For PostgreSQL
DO $$ 
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PlatformSettings' 
        AND column_name = 'basePrice'
    ) THEN
        -- Add basePrice column
        ALTER TABLE "PlatformSettings" 
        ADD COLUMN "basePrice" DECIMAL(10, 2) NOT NULL DEFAULT 100.0;
        
        RAISE NOTICE 'Added ''basePrice'' column to PlatformSettings';
    ELSE
        RAISE NOTICE '''basePrice'' column already exists in PlatformSettings';
    END IF;
END $$;

-- Update existing records with default value if needed
UPDATE "PlatformSettings" 
SET "basePrice" = 100.0 
WHERE "basePrice" IS NULL;

