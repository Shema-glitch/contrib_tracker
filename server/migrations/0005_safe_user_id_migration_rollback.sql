-- Start a transaction to ensure atomicity
BEGIN;

-- Create a new table with serial ID
CREATE TABLE users_old (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    password_hash TEXT,
    otp_hash TEXT,
    otp_expires_at TIMESTAMP WITH TIME ZONE
);

-- Copy data from new table to old table
INSERT INTO users_old (email, name, is_active, created_at, password_hash, otp_hash, otp_expires_at)
SELECT email, name, is_active, created_at, password_hash, otp_hash, otp_expires_at
FROM users;

-- Create a mapping table for ID relationships
CREATE TABLE id_mapping (
    old_id UUID,
    new_id INTEGER
);

-- Store the ID mappings
INSERT INTO id_mapping (old_id, new_id)
SELECT u.id, uo.id
FROM users u
JOIN users_old uo ON u.email = uo.email;

-- Update foreign key references in sessions table
UPDATE sessions
SET user_id = m.new_id::text
FROM id_mapping m
WHERE sessions.user_id = m.old_id::text;

-- Update foreign key references in notifications table
UPDATE notifications
SET user_id = m.new_id::text
FROM id_mapping m
WHERE notifications.user_id = m.old_id::text;

-- Drop the new table and rename the old one
DROP TABLE users;
ALTER TABLE users_old RENAME TO users;

-- Drop the mapping table
DROP TABLE id_mapping;

-- Commit the transaction
COMMIT; 