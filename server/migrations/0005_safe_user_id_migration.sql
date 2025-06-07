-- Start a transaction to ensure atomicity
BEGIN;

-- Drop the foreign key constraint on notifications
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Drop the users table
DROP TABLE IF EXISTS users;

-- Create the new users table with UUID
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    password_hash TEXT,
    otp_hash TEXT,
    otp_expires_at TIMESTAMP WITH TIME ZONE
);

-- Re-add the foreign key constraint
ALTER TABLE notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Commit the transaction
COMMIT; 