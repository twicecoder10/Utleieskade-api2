-- IMMEDIATE FIX: Run this SQL in Railway's PostgreSQL database console
-- This will convert Property.propertyId from UUID to VARCHAR(255)

-- Step 1: Drop foreign key constraint from Case table
ALTER TABLE "Case" DROP CONSTRAINT IF EXISTS "Case_propertyId_fkey";

-- Step 2: Convert Property.propertyId from UUID to VARCHAR(255)
ALTER TABLE "Property" 
ALTER COLUMN "propertyId" TYPE VARCHAR(255) 
USING "propertyId"::text;

-- Step 3: Recreate foreign key constraint
ALTER TABLE "Case" 
ADD CONSTRAINT "Case_propertyId_fkey" 
FOREIGN KEY ("propertyId") 
REFERENCES "Property"("propertyId") 
ON DELETE CASCADE;

-- Verify the change
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND column_name = 'propertyId';

