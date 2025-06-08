CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  data TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
 
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions (expire); 