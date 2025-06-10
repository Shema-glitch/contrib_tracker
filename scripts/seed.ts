import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { members, contributions, loans, notifications, users, type InsertMember, type InsertContribution, type InsertLoan } from '../shared/schema';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL as string;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create admin users first
    console.log('Creating admin users...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const userData = [
      {
        email: "admin@fundsync.com",
        name: "System Admin",
        isAdmin: true,
        isActive: true,
        passwordHash: hashedPassword
      },
      {
        email: "manager@fundsync.com",
        name: "Fund Manager",
        isAdmin: true,
        isActive: true,
        passwordHash: hashedPassword
      }
    ];

    const createdUsers = await db.insert(users).values(userData).returning();
    console.log(`✅ Created ${createdUsers.length} admin users`);

    // Create sample notifications
    console.log('Creating notifications...');
    const notificationData = [
      {
        userId: createdUsers[0].id,
        type: 'info',
        title: 'System Update',
        message: 'The system has been updated with new features',
        is_read: false,
        data: { 
          type: 'system',
          timestamp: new Date().toISOString()
        },
      },
      {
        userId: createdUsers[1].id,
        type: 'success',
        title: 'Welcome to FundSync',
        message: 'Welcome to FundSync! We are excited to have you as a manager.',
        is_read: false,
        data: {
          type: 'welcome',
          timestamp: new Date().toISOString()
        },
      },
      {
        userId: createdUsers[0].id,
        type: 'warning',
        title: 'Maintenance Notice',
        message: 'System maintenance is scheduled for tomorrow at 2 AM',
        is_read: false,
        data: {
          type: 'maintenance',
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
      }
    ];

    const createdNotifications = await db.insert(notifications).values(notificationData).returning();
    console.log(`✅ Created ${createdNotifications.length} notifications`);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
  process.exit(0);
}

seed();
