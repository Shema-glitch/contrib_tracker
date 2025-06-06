
import { Pool } from '@neondatabase/serverless';

async function createAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const result = await pool.query(`
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
    await pool.end();
  }
}

createAdmin();
