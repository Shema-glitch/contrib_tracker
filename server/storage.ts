import { db } from "./db";
import { and, desc, eq, gte, sql } from "drizzle-orm";
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
} from "@shared/schema";

export class Storage {
  async init() {
    console.log("Database connection initialized successfully");
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
      expiresAt,
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
          gte(otpTokens.expiresAt, new Date())
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
      .select({ sum: sql<string>`sum(cast(amount as decimal))` })
      .from(contributions)
      .where(eq(contributions.isPaid, true));

    const activeLoans = await db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(eq(loans.status, "active"));

    const totalPenalties = await db
      .select({ sum: sql<string>`sum(cast(amount as decimal))` })
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