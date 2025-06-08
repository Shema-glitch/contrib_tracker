import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL as string;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

async function dropAllTables() {
  try {
    const sql = neon(DATABASE_URL);
    
    // Drop all tables in the public schema
    await sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `;
    
    console.log('All tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
    process.exit(1);
  }
}

dropAllTables().then(() => {
  console.log('You can now run npm run db:push to create fresh tables');
  process.exit(0);
});
