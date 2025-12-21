-- Migration: Add 'caseId' column to InspectorPayment table
-- This links inspector payments to specific cases

DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'InspectorPayment' 
        AND column_name = 'caseId'
    ) THEN
        -- Add the column
        ALTER TABLE "InspectorPayment" 
        ADD COLUMN "caseId" VARCHAR(255) NULL;
        
        RAISE NOTICE 'Added ''caseId'' column to InspectorPayment';
    ELSE
        RAISE NOTICE '''caseId'' column already exists in InspectorPayment';
    END IF;
END $$;

