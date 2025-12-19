-- Migration: Add 'pending' to Case.caseStatus enum
-- This fixes the error: "invalid input value for enum enum case case status pending"

-- For PostgreSQL
DO $$ 
BEGIN
    -- Check if 'pending' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'enum_Case_caseStatus'
        )
    ) THEN
        -- Add 'pending' to the enum
        ALTER TYPE "enum_Case_caseStatus" ADD VALUE 'pending';
        RAISE NOTICE 'Added ''pending'' to enum_Case_caseStatus';
    ELSE
        RAISE NOTICE '''pending'' already exists in enum_Case_caseStatus';
    END IF;
END $$;

-- Verify the enum values
SELECT enumlabel as case_status_value 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_Case_caseStatus')
ORDER BY enumsortorder;

