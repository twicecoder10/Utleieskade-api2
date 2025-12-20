-- Add pdfUrl column to Report table
-- This migration adds the pdfUrl column to store the Azure Blob Storage URL of generated PDF reports

-- Add pdfUrl column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Report' AND column_name = 'pdfUrl'
    ) THEN
        ALTER TABLE "Report" ADD COLUMN "pdfUrl" VARCHAR(500);
        COMMENT ON COLUMN "Report"."pdfUrl" IS 'Azure Blob Storage URL for the generated PDF report';
    END IF;
END $$;

