-- Migration to change paymentAmount from VARCHAR to DECIMAL in InspectorPayment table
-- This fixes the PostgreSQL error: function sum(character varying) does not exist

DO $$ 
BEGIN
    -- Check if column exists and is currently VARCHAR/TEXT type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'InspectorPayment' 
        AND column_name = 'paymentAmount'
        AND (data_type = 'character varying' OR data_type = 'text' OR data_type = 'varchar')
    ) THEN
        -- Convert existing string values to numeric, handling invalid values
        -- First, try to update any invalid numeric strings to 0
        UPDATE "InspectorPayment"
        SET "paymentAmount" = '0'
        WHERE "paymentAmount" IS NOT NULL
        AND "paymentAmount" !~ '^-?[0-9]+\.?[0-9]*$';
        
        -- Now alter the column type to DECIMAL
        ALTER TABLE "InspectorPayment" 
        ALTER COLUMN "paymentAmount" TYPE DECIMAL(10, 2) 
        USING CAST(
            CASE 
                WHEN "paymentAmount" ~ '^-?[0-9]+\.?[0-9]*$' 
                THEN "paymentAmount" 
                ELSE '0' 
            END 
            AS DECIMAL(10, 2)
        );
        
        RAISE NOTICE 'Successfully converted paymentAmount column to DECIMAL(10, 2)';
    ELSE
        RAISE NOTICE 'paymentAmount column does not exist or is already numeric type';
    END IF;
END $$;

