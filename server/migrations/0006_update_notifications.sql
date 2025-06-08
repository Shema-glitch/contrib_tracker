-- Drop existing foreign key constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Update user_id column to UUID
ALTER TABLE notifications 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Add new foreign key constraint
ALTER TABLE notifications 
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id); 