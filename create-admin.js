
import pg from 'pg';
const { Client } = pg;

async function createAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    const result = await client.query(`
      INSERT INTO admins (email, name, is_active) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name,
        is_active = EXCLUDED.is_active
      RETURNING *
    `, ['charmantshema112@gmail.com', 'Admin User', true]);
    
    console.log('Admin created successfully:', result.rows[0]);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await client.end();
  }
}

createAdmin();
