CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);
 
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions (expire); 