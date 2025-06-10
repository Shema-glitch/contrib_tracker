-- Fix notifications to reference users instead of members
DO $$ 
BEGIN
    -- First check if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Drop existing foreign key if it exists
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'notifications_user_id_fkey' 
                  AND table_name = 'notifications') THEN
            ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey;
        END IF;

        -- Add foreign key constraint to users table
        ALTER TABLE notifications 
            ADD CONSTRAINT notifications_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$; 