-- Add data column and fix column types for notifications table
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

        -- Convert id to serial if it's UUID
        ALTER TABLE notifications 
            ALTER COLUMN id DROP DEFAULT,
            ALTER COLUMN id SET DATA TYPE integer USING (nextval('notifications_id_seq')),
            ALTER COLUMN id SET DEFAULT nextval('notifications_id_seq');

        -- Convert user_id to integer if it's UUID
        ALTER TABLE notifications 
            ALTER COLUMN user_id SET DATA TYPE integer USING (user_id::text::integer);

        -- Add foreign key constraint to members table
        ALTER TABLE notifications 
            ADD CONSTRAINT notifications_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE CASCADE;

        -- Rename 'read' column to 'is_read' if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'notifications' AND column_name = 'read') THEN
            ALTER TABLE notifications RENAME COLUMN read TO is_read;
        END IF;

        -- Add data column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'notifications' AND column_name = 'data') THEN
            ALTER TABLE notifications ADD COLUMN data jsonb DEFAULT '{}';
        END IF;
    END IF;
END $$;
