import { 
  members, 
  contributions, 
  loans, 
  penalties, 
  admins, 
  otpTokens, 
  settings,
  type Member, 
  type InsertMember,
  type Contribution,
  type InsertContribution,
  type Loan,
  type InsertLoan,
  type Penalty,
  type InsertPenalty,
  type Admin,
  type InsertAdmin,
  type OtpToken,
  type Settings,
  type InsertSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Members
  getMembers(): Promise<Member[]>;
  getMember(id: number): Promise<Member | undefined>;
  getMemberByEmail(email: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMemberContributions(id: number, amount: string): Promise<void>;

  // Contributions
  getContributions(): Promise<Contribution[]>;
  getContributionsByMember(memberId: number): Promise<Contribution[]>;
  getContributionsByMonth(month: string): Promise<Contribution[]>;
  getContribution(id: number): Promise<Contribution | undefined>;
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  updateContribution(id: number, updates: Partial<Contribution>): Promise<void>;
  
  // Loans
  getLoans(): Promise<Loan[]>;
  getLoansByMember(memberId: number): Promise<Loan[]>;
  getActiveLoansByMember(memberId: number): Promise<Loan[]>;
  getLoan(id: number): Promise<Loan | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(id: number, updates: Partial<Loan>): Promise<void>;

  // Penalties
  getPenalties(): Promise<Penalty[]>;
  getPenaltiesByMember(memberId: number): Promise<Penalty[]>;
  createPenalty(penalty: InsertPenalty): Promise<Penalty>;
  updatePenalty(id: number, updates: Partial<Penalty>): Promise<void>;

  // Admins
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // OTP
  createOtpToken(email: string, token: string, expiresAt: Date): Promise<OtpToken>;
  getValidOtpToken(email: string, token: string): Promise<OtpToken | undefined>;
  markOtpAsUsed(id: number): Promise<void>;

  // Settings
  getSetting(key: string): Promise<Settings | undefined>;
  setSetting(key: string, value: string): Promise<void>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalContributionsThisMonth: string;
    activeLoans: number;
    latePayments: number;
    penaltiesCollected: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Members
  async getMembers(): Promise<Member[]> {
    return await db.select().from(members).orderBy(members.name);
  }

  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMemberByEmail(email: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.email, email));
    return member || undefined;
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [newMember] = await db.insert(members).values(member).returning();
    return newMember;
  }

  async updateMemberContributions(id: number, amount: string): Promise<void> {
    await db.update(members)
      .set({ 
        totalContributions: sql`COALESCE(${members.totalContributions}, 0) + ${amount}` 
      })
      .where(eq(members.id, id));
  }

  // Contributions
  async getContributions(): Promise<Contribution[]> {
    return await db.select().from(contributions).orderBy(desc(contributions.createdAt));
  }

  async getContributionsByMember(memberId: number): Promise<Contribution[]> {
    return await db.select().from(contributions)
      .where(eq(contributions.memberId, memberId))
      .orderBy(desc(contributions.month));
  }

  async getContributionsByMonth(month: string): Promise<Contribution[]> {
    return await db.select().from(contributions)
      .where(eq(contributions.month, month))
      .orderBy(contributions.paymentDate);
  }

  async getContribution(id: number): Promise<Contribution | undefined> {
    const [contribution] = await db.select().from(contributions).where(eq(contributions.id, id));
    return contribution || undefined;
  }

  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const [newContribution] = await db.insert(contributions).values(contribution).returning();
    return newContribution;
  }

  async updateContribution(id: number, updates: Partial<Contribution>): Promise<void> {
    await db.update(contributions).set(updates).where(eq(contributions.id, id));
  }

  // Loans
  async getLoans(): Promise<Loan[]> {
    return await db.select().from(loans).orderBy(desc(loans.createdAt));
  }

  async getLoansByMember(memberId: number): Promise<Loan[]> {
    return await db.select().from(loans)
      .where(eq(loans.memberId, memberId))
      .orderBy(desc(loans.issueDate));
  }

  async getActiveLoansByMember(memberId: number): Promise<Loan[]> {
    return await db.select().from(loans)
      .where(and(eq(loans.memberId, memberId), eq(loans.isRepaid, false)))
      .orderBy(desc(loans.issueDate));
  }

  async getLoan(id: number): Promise<Loan | undefined> {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    return loan || undefined;
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const [newLoan] = await db.insert(loans).values(loan).returning();
    return newLoan;
  }

  async updateLoan(id: number, updates: Partial<Loan>): Promise<void> {
    await db.update(loans).set(updates).where(eq(loans.id, id));
  }

  // Penalties
  async getPenalties(): Promise<Penalty[]> {
    return await db.select().from(penalties).orderBy(desc(penalties.appliedDate));
  }

  async getPenaltiesByMember(memberId: number): Promise<Penalty[]> {
    return await db.select().from(penalties)
      .where(eq(penalties.memberId, memberId))
      .orderBy(desc(penalties.appliedDate));
  }

  async createPenalty(penalty: InsertPenalty): Promise<Penalty> {
    const [newPenalty] = await db.insert(penalties).values(penalty).returning();
    return newPenalty;
  }

  async updatePenalty(id: number, updates: Partial<Penalty>): Promise<void> {
    await db.update(penalties).set(updates).where(eq(penalties.id, id));
  }

  // Admins
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin || undefined;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [newAdmin] = await db.insert(admins).values(admin).returning();
    return newAdmin;
  }

  // OTP
  async createOtpToken(email: string, token: string, expiresAt: Date): Promise<OtpToken> {
    const [otpToken] = await db.insert(otpTokens).values({
      email,
      token,
      expiresAt,
    }).returning();
    return otpToken;
  }

  async getValidOtpToken(email: string, token: string): Promise<OtpToken | undefined> {
    const [otpToken] = await db.select().from(otpTokens)
      .where(and(
        eq(otpTokens.email, email),
        eq(otpTokens.token, token),
        eq(otpTokens.isUsed, false),
        gte(otpTokens.expiresAt, new Date())
      ));
    return otpToken || undefined;
  }

  async markOtpAsUsed(id: number): Promise<void> {
    await db.update(otpTokens).set({ isUsed: true }).where(eq(otpTokens.id, id));
  }

  // Settings
  async getSetting(key: string): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db.insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: sql`NOW()` }
      });
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalContributionsThisMonth: string;
    activeLoans: number;
    latePayments: number;
    penaltiesCollected: string;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Get this month's contributions
    const [monthlyContributions] = await db.select({
      total: sql<string>`COALESCE(SUM(${contributions.amount}), 0)`
    }).from(contributions).where(eq(contributions.month, currentMonth));

    // Get active loans count
    const [activeLoansCount] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(loans).where(eq(loans.isRepaid, false));

    // Get late payments count
    const [latePaymentsCount] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(contributions).where(and(
      eq(contributions.isPaid, false),
      lte(contributions.dueDate, new Date().toISOString().slice(0, 10))
    ));

    // Get penalties collected this month
    const [penaltiesThisMonth] = await db.select({
      total: sql<string>`COALESCE(SUM(${penalties.amount}), 0)`
    }).from(penalties).where(and(
      eq(penalties.isPaid, true),
      gte(penalties.appliedDate, `${currentMonth}-01`)
    ));

    return {
      totalContributionsThisMonth: monthlyContributions.total,
      activeLoans: activeLoansCount.count,
      latePayments: latePaymentsCount.count,
      penaltiesCollected: penaltiesThisMonth.total,
    };
  }
}

export const storage = new DatabaseStorage();
