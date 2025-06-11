-- Drop and recreate contributions table with correct types
DO $$ 
BEGIN
    -- Drop the existing table if it exists
    DROP TABLE IF EXISTS contributions CASCADE;

    -- Create the table with correct types
    CREATE TABLE contributions (
        id SERIAL PRIMARY KEY,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        month DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_date DATE,
        due_date DATE NOT NULL,
        is_paid BOOLEAN DEFAULT FALSE,
        late_fee DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX idx_contributions_member_id ON contributions(member_id);
    CREATE INDEX idx_contributions_month ON contributions(month);
END $$; 