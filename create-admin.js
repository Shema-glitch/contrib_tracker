
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Create admins table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const email = 'charmantshema112@gmail.com';
    const name = 'Admin User';
    const password = 'admin123'; // Default password - should be changed after first login
    
    // Hash the password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT id FROM admins WHERE email = $1',
      [email]
    );

    if (existingAdmin.rows.length > 0) {
      // Update existing admin with password
      const result = await pool.query(
        'UPDATE admins SET password_hash = $1, name = $2, is_active = true WHERE email = $3 RETURNING *',
        [passwordHash, name, email]
      );
      console.log('Admin updated successfully:', result.rows[0]);
      console.log(`\n🔑 Login credentials:`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log(`\n⚠️  Please change the password after first login!`);
    } else {
      // Create new admin
      const result = await pool.query(
        'INSERT INTO admins (email, password_hash, name, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, passwordHash, name, true]
      );
      console.log('Admin created successfully:', result.rows[0]);
      console.log(`\n🔑 Login credentials:`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log(`\n⚠️  Please change the password after first login!`);
    }

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();
