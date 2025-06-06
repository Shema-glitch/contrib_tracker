import {
  admins,
  members,
  contributions,
  loans,
  penalties,
  settings,
  emailLogs,
  otpSessions,
  type Admin,
  type Member,
  type Contribution,
  type Loan,
  type Penalty,
  type Setting,
  type EmailLog,
  type OtpSession,
  type InsertAdmin,
  type InsertMember,
  type InsertContribution,
  type InsertLoan,
  type InsertPenalty,
  type InsertSetting,
  type InsertEmailLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, count } from "drizzle-orm";

export interface IStorage {
  // Admin operations
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // OTP operations
  createOtpSession(email: string, code: string, expiresAt: Date): Promise<OtpSession>;
  getValidOtpSession(email: string, code: string): Promise<OtpSession | undefined>;
  markOtpAsUsed(id: number): Promise<void>;

  // Member operations
  getAllMembers(): Promise<Member[]>;
  getMemberById(id: number): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  getMemberByMemberId(memberId: string): Promise<Member | undefined>;

  // Contribution operations
  getContributionsByMember(memberId: number): Promise<Contribution[]>;
  getContributionByMemberAndMonth(memberId: number, month: string): Promise<Contribution | undefined>;
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  updateContribution(id: number, updates: Partial<Contribution>): Promise<Contribution>;
  getContributionsForMonth(month: string): Promise<Contribution[]>;
  getTotalContributionsByMember(memberId: number): Promise<number>;

  // Loan operations
  getLoansByMember(memberId: number): Promise<Loan[]>;
  getLoanById(id: number): Promise<Loan | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(id: number, updates: Partial<Loan>): Promise<Loan>;
  getActiveLoansByMember(memberId: number): Promise<Loan[]>;
  getAllActiveLoans(): Promise<Loan[]>;

  // Penalty operations
  getPenaltiesByMember(memberId: number): Promise<Penalty[]>;
  createPenalty(penalty: InsertPenalty): Promise<Penalty>;
  updatePenalty(id: number, updates: Partial<Penalty>): Promise<Penalty>;
  getOutstandingPenalties(): Promise<Penalty[]>;

  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string, description?: string): Promise<Setting>;

  // Email log operations
  createEmailLog(emailLog: InsertEmailLog): Promise<EmailLog>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalContributions: number;
    activeLoans: number;
    latePayments: number;
    totalPenalties: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin || undefined;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [created] = await db.insert(admins).values(admin).returning();
    return created;
  }

  async createOtpSession(email: string, code: string, expiresAt: Date): Promise<OtpSession> {
    const [session] = await db
      .insert(otpSessions)
      .values({ email, code, expiresAt })
      .returning();
    return session;
  }

  async getValidOtpSession(email: string, code: string): Promise<OtpSession | undefined> {
    const [session] = await db
      .select()
      .from(otpSessions)
      .where(
        and(
          eq(otpSessions.email, email),
          eq(otpSessions.code, code),
          eq(otpSessions.isUsed, false),
          gte(otpSessions.expiresAt, new Date())
        )
      );
    return session || undefined;
  }

  async markOtpAsUsed(id: number): Promise<void> {
    await db
      .update(otpSessions)
      .set({ isUsed: true })
      .where(eq(otpSessions.id, id));
  }

  async getAllMembers(): Promise<Member[]> {
    return await db.select().from(members).orderBy(members.name);
  }

  async getMemberById(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [created] = await db.insert(members).values(member).returning();
    return created;
  }

  async getMemberByMemberId(memberId: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.memberId, memberId));
    return member || undefined;
  }

  async getContributionsByMember(memberId: number): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.memberId, memberId))
      .orderBy(desc(contributions.createdAt));
  }

  async getContributionByMemberAndMonth(memberId: number, month: string): Promise<Contribution | undefined> {
    const [contribution] = await db
      .select()
      .from(contributions)
      .where(and(eq(contributions.memberId, memberId), eq(contributions.month, month)));
    return contribution || undefined;
  }

  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const [created] = await db.insert(contributions).values(contribution).returning();
    return created;
  }

  async updateContribution(id: number, updates: Partial<Contribution>): Promise<Contribution> {
    const [updated] = await db
      .update(contributions)
      .set(updates)
      .where(eq(contributions.id, id))
      .returning();
    return updated;
  }

  async getContributionsForMonth(month: string): Promise<Contribution[]> {
    return await db.select().from(contributions).where(eq(contributions.month, month));
  }

  async getTotalContributionsByMember(memberId: number): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${contributions.paidAmount}), 0)` })
      .from(contributions)
      .where(eq(contributions.memberId, memberId));
    return Number(result[0]?.total || 0);
  }

  async getLoansByMember(memberId: number): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.memberId, memberId))
      .orderBy(desc(loans.createdAt));
  }

  async getLoanById(id: number): Promise<Loan | undefined> {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    return loan || undefined;
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const [created] = await db.insert(loans).values(loan).returning();
    return created;
  }

  async updateLoan(id: number, updates: Partial<Loan>): Promise<Loan> {
    const [updated] = await db
      .update(loans)
      .set(updates)
      .where(eq(loans.id, id))
      .returning();
    return updated;
  }

  async getActiveLoansByMember(memberId: number): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(and(eq(loans.memberId, memberId), eq(loans.status, 'active')));
  }

  async getAllActiveLoans(): Promise<Loan[]> {
    return await db.select().from(loans).where(eq(loans.status, 'active'));
  }

  async getPenaltiesByMember(memberId: number): Promise<Penalty[]> {
    return await db
      .select()
      .from(penalties)
      .where(eq(penalties.memberId, memberId))
      .orderBy(desc(penalties.appliedAt));
  }

  async createPenalty(penalty: InsertPenalty): Promise<Penalty> {
    const [created] = await db.insert(penalties).values(penalty).returning();
    return created;
  }

  async updatePenalty(id: number, updates: Partial<Penalty>): Promise<Penalty> {
    const [updated] = await db
      .update(penalties)
      .set(updates)
      .where(eq(penalties.id, id))
      .returning();
    return updated;
  }

  async getOutstandingPenalties(): Promise<Penalty[]> {
    return await db
      .select()
      .from(penalties)
      .where(eq(penalties.status, 'outstanding'))
      .orderBy(desc(penalties.appliedAt));
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(key: string, value: string, description?: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(settings)
        .values({ key, value, description })
        .returning();
      return created;
    }
  }

  async createEmailLog(emailLog: InsertEmailLog): Promise<EmailLog> {
    const [created] = await db.insert(emailLogs).values(emailLog).returning();
    return created;
  }

  async getDashboardStats(): Promise<{
    totalContributions: number;
    activeLoans: number;
    latePayments: number;
    totalPenalties: number;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const [contributionsResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${contributions.paidAmount}), 0)` })
      .from(contributions)
      .where(eq(contributions.month, currentMonth));

    const [activeLoansResult] = await db
      .select({ count: count() })
      .from(loans)
      .where(eq(loans.status, 'active'));

    const [latePaymentsResult] = await db
      .select({ count: count() })
      .from(contributions)
      .where(and(eq(contributions.month, currentMonth), eq(contributions.status, 'late')));

    const [penaltiesResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${penalties.amount}), 0)` })
      .from(penalties)
      .where(eq(penalties.status, 'outstanding'));

    return {
      totalContributions: Number(contributionsResult?.total || 0),
      activeLoans: activeLoansResult?.count || 0,
      latePayments: latePaymentsResult?.count || 0,
      totalPenalties: Number(penaltiesResult?.total || 0),
    };
  }
}

export const storage = new DatabaseStorage();
