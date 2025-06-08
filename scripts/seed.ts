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

    // Create sample members
    console.log('Creating members...');
    const memberData: InsertMember[] = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        memberId: "M001",
        joinDate: new Date('2025-01-01').toISOString().split('T')[0],
        isActive: true,
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        memberId: "M002",
        joinDate: new Date('2025-01-15').toISOString().split('T')[0],
        isActive: true,
      },
      {
        name: "Bob Wilson",
        email: "bob.wilson@example.com",
        memberId: "M003",
        joinDate: new Date('2025-02-01').toISOString().split('T')[0],
        isActive: true,
      },
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        memberId: "M004",
        joinDate: new Date('2025-03-01').toISOString().split('T')[0],
        isActive: true,
      },
      {
        name: "Michael Chen",
        email: "michael.chen@example.com",
        memberId: "M005",
        joinDate: new Date('2025-03-15').toISOString().split('T')[0],
        isActive: true,
      }
    ];

    const createdMembers = await db.insert(members).values(memberData).returning();
    console.log(`✅ Created ${createdMembers.length} members`);

    // Create sample contributions (6 months worth of data)
    console.log('Creating contributions...');
    const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
    const contributionData: InsertContribution[] = [];

    for (const member of createdMembers) {
      for (const month of months) {
        const dueDate = new Date(`${month}-25`); // Due on the 25th of each month
        const monthStart = new Date(`${month}-01`);
        const randomDay = Math.floor(Math.random() * 28) + 1; // Random payment date
        const paymentDate = new Date(`${month}-${randomDay}`);
        const isLate = paymentDate > dueDate;

        contributionData.push({
          memberId: member.id,
          month,
          amount: "5000",
          paymentDate: paymentDate.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          isPaid: paymentDate <= new Date('2025-06-08'), // Only paid if before current date
          lateFee: isLate ? "500" : "0",
        });
      }
    }

    const createdContributions = await db.insert(contributions).values(contributionData).returning();
    console.log(`✅ Created ${createdContributions.length} contributions`);

    // Create sample loans
    console.log('Creating loans...');
    const loanData: InsertLoan[] = [
      {
        memberId: createdMembers[0].id,
        amount: "20000",
        issueDate: new Date('2025-02-15').toISOString().split('T')[0],
        dueDate: new Date('2025-05-15').toISOString().split('T')[0],
        notes: "Home improvement loan",
      },
      {
        memberId: createdMembers[1].id,
        amount: "15000",
        issueDate: new Date('2025-03-01').toISOString().split('T')[0],
        dueDate: new Date('2025-06-01').toISOString().split('T')[0],
        notes: "Business expansion loan",
      },
      {
        memberId: createdMembers[2].id,
        amount: "10000",
        issueDate: new Date('2025-04-01').toISOString().split('T')[0],
        dueDate: new Date('2025-07-01').toISOString().split('T')[0],
        notes: "Education loan",
      }
    ];

    const createdLoans = await db.insert(loans).values(loanData).returning();
    console.log(`✅ Created ${createdLoans.length} loans`);

    // Create sample notifications
    console.log('Creating notifications...');
    const notificationData = [
      {
        userId: createdMembers[0].id,
        type: 'LOAN_APPROVED',
        title: 'Loan Approved',
        message: 'Your loan request for 20,000 RWF has been approved',
        is_read: false,
        data: { loanId: createdLoans[0].id, amount: "20000" },
      },
      {
        userId: createdMembers[1].id,
        type: 'LOAN_REPAID',
        title: 'Loan Fully Repaid',
        message: 'Congratulations! You have fully repaid your loan',
        is_read: true,
        data: { loanId: createdLoans[1].id, amount: "15000" },
      },
      {
        userId: createdMembers[2].id,
        type: 'CONTRIBUTION_DUE',
        title: 'Contribution Due',
        message: 'Your monthly contribution of 5,000 RWF is due in 5 days',
        is_read: false,
        data: { amount: "5000", dueDate: new Date('2025-06-25').toISOString().split('T')[0] },
      },
      {
        userId: createdMembers[3].id,
        type: 'WELCOME',
        title: 'Welcome to FundSync',
        message: 'Welcome to FundSync! We are excited to have you as a member.',
        is_read: false,
        data: {},
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
