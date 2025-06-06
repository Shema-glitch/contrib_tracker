
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  members,
  contributions,
  loans,
  penalties,
  settings,
  otpTokens,
  admins,
  type InsertMember,
  type InsertContribution,
  type InsertLoan,
} from "./db";

const sqlite = new Database("database.sqlite");
const db = drizzle(sqlite);

export class Storage {
  async init() {
    // Create tables if they don't exist
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        total_contributions TEXT DEFAULT '0',
        join_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS contributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        amount TEXT NOT NULL,
        month TEXT NOT NULL,
        payment_date TEXT,
        is_paid BOOLEAN DEFAULT FALSE,
        late_fee TEXT DEFAULT '0',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        amount TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS penalties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount TEXT NOT NULL,
        reason TEXT NOT NULL,
        date_applied TEXT NOT NULL,
        is_waived BOOLEAN DEFAULT FALSE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS otp_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database initialized successfully");
  }

  // Admin methods
  async createAdmin(email: string, name: string, password?: string) {
    const passwordHash = password ? bcrypt.hashSync(password, 10) : null;
    
    const [admin] = await db
      .insert(admins)
      .values({
        email,
        name,
        passwordHash,
      })
      .returning();
    return admin;
  }

  async getAdminByEmail(email: string) {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);
    return admin;
  }

  async validateAdminPassword(email: string, password: string): Promise<boolean> {
    const admin = await this.getAdminByEmail(email);
    if (!admin || !admin.passwordHash) {
      return false;
    }
    return bcrypt.compareSync(password, admin.passwordHash);
  }

  async updateAdminPassword(email: string, newPassword: string) {
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await db
      .update(admins)
      .set({ passwordHash })
      .where(eq(admins.email, email));
  }

  // OTP methods
  async createOtpToken(email: string, token: string, expiresAt: Date) {
    await db.insert(otpTokens).values({
      email,
      token,
      expiresAt: expiresAt.toISOString(),
    });
  }

  async getValidOtpToken(email: string, token: string) {
    const [otpToken] = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.email, email),
          eq(otpTokens.token, token),
          eq(otpTokens.isUsed, false),
          gte(otpTokens.expiresAt, new Date().toISOString())
        )
      )
      .limit(1);
    return otpToken;
  }

  async markOtpAsUsed(id: number) {
    await db
      .update(otpTokens)
      .set({ isUsed: true })
      .where(eq(otpTokens.id, id));
  }

  // Member methods
  async getMembers() {
    return await db.select().from(members).orderBy(desc(members.createdAt));
  }

  async getMember(id: number) {
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, id))
      .limit(1);
    return member;
  }

  async createMember(data: InsertMember) {
    const [member] = await db.insert(members).values(data).returning();
    return member;
  }

  async updateMemberContributions(memberId: number, amount: string) {
    const member = await this.getMember(memberId);
    if (member) {
      const currentTotal = parseFloat(member.totalContributions || "0");
      const newTotal = currentTotal + parseFloat(amount);
      
      await db
        .update(members)
        .set({ totalContributions: newTotal.toString() })
        .where(eq(members.id, memberId));
    }
  }

  // Contribution methods
  async getContributions() {
    return await db
      .select({
        id: contributions.id,
        memberId: contributions.memberId,
        amount: contributions.amount,
        month: contributions.month,
        paymentDate: contributions.paymentDate,
        isPaid: contributions.isPaid,
        lateFee: contributions.lateFee,
        createdAt: contributions.createdAt,
        memberName: members.name,
        memberEmail: members.email,
      })
      .from(contributions)
      .leftJoin(members, eq(contributions.memberId, members.id))
      .orderBy(desc(contributions.createdAt));
  }

  async getContributionsByMember(memberId: number) {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.memberId, memberId))
      .orderBy(desc(contributions.createdAt));
  }

  async createContribution(data: InsertContribution) {
    const [contribution] = await db
      .insert(contributions)
      .values(data)
      .returning();
    return contribution;
  }

  // Loan methods
  async getLoans() {
    return await db
      .select({
        id: loans.id,
        memberId: loans.memberId,
        amount: loans.amount,
        issueDate: loans.issueDate,
        dueDate: loans.dueDate,
        status: loans.status,
        notes: loans.notes,
        createdAt: loans.createdAt,
        memberName: members.name,
        memberEmail: members.email,
      })
      .from(loans)
      .leftJoin(members, eq(loans.memberId, members.id))
      .orderBy(desc(loans.createdAt));
  }

  async createLoan(data: InsertLoan) {
    const [loan] = await db.insert(loans).values(data).returning();
    return loan;
  }

  // Penalty methods
  async getPenalties() {
    return await db
      .select({
        id: penalties.id,
        memberId: penalties.memberId,
        type: penalties.type,
        amount: penalties.amount,
        reason: penalties.reason,
        dateApplied: penalties.dateApplied,
        isWaived: penalties.isWaived,
        createdAt: penalties.createdAt,
        memberName: members.name,
        memberEmail: members.email,
      })
      .from(penalties)
      .leftJoin(members, eq(penalties.memberId, members.id))
      .orderBy(desc(penalties.createdAt));
  }

  // Settings methods
  async getSetting(key: string) {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    return setting;
  }

  async setSetting(key: string, value: string) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value },
      });
  }

  // Dashboard stats
  async getDashboardStats() {
    const totalMembers = await db
      .select({ count: sql<number>`count(*)` })
      .from(members);

    const totalContributions = await db
      .select({ sum: sql<string>`sum(cast(amount as real))` })
      .from(contributions)
      .where(eq(contributions.isPaid, true));

    const activeLoans = await db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(eq(loans.status, "active"));

    const totalPenalties = await db
      .select({ sum: sql<string>`sum(cast(amount as real))` })
      .from(penalties)
      .where(eq(penalties.isWaived, false));

    return {
      totalMembers: totalMembers[0]?.count || 0,
      totalContributions: parseFloat(totalContributions[0]?.sum || "0"),
      activeLoans: activeLoans[0]?.count || 0,
      totalPenalties: parseFloat(totalPenalties[0]?.sum || "0"),
    };
  }
}

export const storage = new Storage();
