import { db } from "./db";
import { and, desc, eq, gte, sql, type SQL } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  members,
  contributions,
  loans,
  penalties,
  settings,
  otpTokens,
  users,
  notifications,
  type InsertMember,
  type InsertContribution,
  type InsertLoan,
} from "@shared/schema";

interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  month?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type QueryBuilder = ReturnType<typeof db.select>;

interface WhereCondition {
  sql: string;
  params: unknown[];
}

export class Storage {
  async init() {
    console.log("Database connection initialized successfully");
  }

  // Admin methods
  async createAdmin(email: string, name: string, password?: string) {
    const passwordHash = password ? bcrypt.hashSync(password, 10) : null;

    const [admin] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        isAdmin: true,
      })
      .returning();
    return admin;
  }

  async getAdminByEmail(email: string) {
    const [admin] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.isAdmin, true)
        )
      )
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
      .update(users)
      .set({ passwordHash })
      .where(
        and(
          eq(users.email, email),
          eq(users.isAdmin, true)
        )
      );
  }

  // Member methods
  async getMemberById(id: number) {
    try {
      const [member] = await db
        .select()
        .from(members)
        .where(eq(members.id, id))
        .limit(1);
      return member;
    } catch (error) {
      console.error("Error getting member:", error);
      return null;
    }
  }

  // OTP methods
  async createOtpToken(email: string, token: string, expiresAt: Date) {
    const [otpToken] = await db
      .insert(otpTokens)
      .values({
        email,
        token,
        expiresAt,
      })
      .returning();
    return otpToken;
  }

  async getValidOtpToken(email: string, token: string) {
    const [otpToken] = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.email, email),
          eq(otpTokens.token, token),
          eq(otpTokens.is_used, false),
          gte(otpTokens.expiresAt, new Date())
        )
      )
      .limit(1);
    return otpToken;
  }

  async markOtpAsUsed(id: number) {
    await db
      .update(otpTokens)
      .set({ is_used: true })
      .where(eq(otpTokens.id, id));
  }

  // Notification methods
  async insertNotification(data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }) {
    try {
      const [result] = await db
        .insert(notifications)
        .values({
          ...data,
          createdAt: new Date()
        })
        .returning();
      return result;
    } catch (error) {
      console.error("Error inserting notification:", error);
      return null;
    }
  }

  // Member methods
  async getMembers({ page = 1, pageSize = 10, search = '', status }: PaginationParams = {}): Promise<PaginatedResult<typeof members.$inferSelect>> {
    const offset = (page - 1) * pageSize;
    const conditions: SQL[] = [];
    
    if (search) {
      conditions.push(sql`(LOWER(${members.name}::text) LIKE ${`%${search.toLowerCase()}%`} OR LOWER(${members.email}::text) LIKE ${`%${search.toLowerCase()}%`})`);
    }
    
    if (status === 'active') {
      conditions.push(sql`${members.isActive} = true`);
    } else if (status === 'inactive') {
      conditions.push(sql`${members.isActive} = false`);
    }
    
    const baseQuery = db.select().from(members);
    const query = conditions.length > 0
      ? baseQuery.where(sql`${and(...conditions)}`)
      : baseQuery;

    const [items, totalResults] = await Promise.all([
      query.limit(pageSize).offset(offset).orderBy(desc(members.createdAt)),
      db.select({ count: sql<number>`count(*)` }).from(members)
        .then(result => Number(result[0].count))
    ]);

    return {
      data: items,
      total: totalResults,
      page,
      pageSize,
      totalPages: Math.ceil(totalResults / pageSize)
    };
  }

  async getMember(id: number) {
    try {
      const [member] = await db
        .select({
          id: members.id,
          name: members.name,
          email: members.email,
          memberId: members.memberId,
          joinDate: members.joinDate,
          totalContributions: members.totalContributions,
          isActive: members.isActive,
          createdAt: members.createdAt,
          contributions: sql`COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', ${contributions.id},
                'month', ${contributions.month},
                'amount', ${contributions.amount},
                'paymentDate', ${contributions.paymentDate},
                'dueDate', ${contributions.dueDate},
                'isPaid', ${contributions.isPaid},
                'lateFee', ${contributions.lateFee}
              ) ORDER BY ${contributions.month} DESC
            ) FILTER (WHERE ${contributions.id} IS NOT NULL),
            '[]'::jsonb
          )::json as contributions`,
          loans: sql`COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', ${loans.id},
                'amount', ${loans.amount},
                'issueDate', ${loans.issueDate},
                'dueDate', ${loans.dueDate},
                'repaidAmount', ${loans.repaidAmount},
                'isRepaid', ${loans.isRepaid},
                'penalty', ${loans.penalty},
                'notes', ${loans.notes}
              ) ORDER BY ${loans.issueDate} DESC
            ) FILTER (WHERE ${loans.id} IS NOT NULL),
            '[]'::jsonb
          )::json as loans`,
          penalties: sql`COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', ${penalties.id},
                'type', ${penalties.type},
                'amount', ${penalties.amount},
                'appliedDate', ${penalties.appliedDate},
                'isPaid', ${penalties.isPaid},
                'isWaived', ${penalties.isWaived},
                'reason', ${penalties.reason}
              ) ORDER BY ${penalties.appliedDate} DESC
            ) FILTER (WHERE ${penalties.id} IS NOT NULL),
            '[]'::jsonb
          )::json as penalties`
        })
        .from(members)
        .leftJoin(contributions, eq(contributions.memberId, members.id))
        .leftJoin(loans, eq(loans.memberId, members.id))
        .leftJoin(penalties, eq(penalties.memberId, members.id))
        .where(eq(members.id, id))
        .groupBy(members.id)
        .limit(1);

      return member || null;
    } catch (error) {
      console.error("Error getting member details:", error);
      throw new Error("Failed to get member details");
    }
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
  async getContributions({ page = 1, pageSize = 10, search = '', month }: PaginationParams = {}): Promise<PaginatedResult<typeof contributions.$inferSelect>> {
    const offset = (page - 1) * pageSize;
    const conditions: SQL[] = [];
    
    if (month && month !== 'all') {
      if (month === 'current') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        conditions.push(sql`DATE_TRUNC('month', ${contributions.month}::date) = DATE_TRUNC('month', ${currentMonth}::date)`);
      } else {
        try {
          const parsedMonth = new Date(month + '-01').toISOString().slice(0, 7);
          conditions.push(sql`DATE_TRUNC('month', ${contributions.month}::date) = DATE_TRUNC('month', ${parsedMonth}::date)`);
        } catch (e) {
          console.error('Invalid month format:', month);
          // Skip the condition if the month is invalid
        }
      }
    }
    
    const baseQuery = db.select().from(contributions);
    const query = conditions.length > 0
      ? baseQuery.where(sql`${and(...conditions)}`)
      : baseQuery;

    const [items, totalResults] = await Promise.all([
      query.limit(pageSize).offset(offset).orderBy(desc(contributions.createdAt)),
      db.select({ count: sql<number>`count(*)` }).from(contributions)
        .then(result => Number(result[0].count))
    ]);

    return {
      data: items,
      total: totalResults,
      page,
      pageSize,
      totalPages: Math.ceil(totalResults / pageSize)
    };
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
  async getLoans({ page = 1, pageSize = 10, search = '', status }: PaginationParams = {}): Promise<PaginatedResult<typeof loans.$inferSelect>> {
    const offset = (page - 1) * pageSize;
    const conditions: SQL[] = [];
    
    if (search) {
      conditions.push(sql`CAST(${loans.amount} AS text) LIKE ${`%${search}%`}`);
    }

    if (status === 'active') {
      conditions.push(sql`${loans.isRepaid} = false`);
    } else if (status === 'repaid') {
      conditions.push(sql`${loans.isRepaid} = true`);
    }
    
    const baseQuery = db.select().from(loans);
    const query = conditions.length > 0
      ? baseQuery.where(sql`${and(...conditions)}`)
      : baseQuery;

    const [items, totalResults] = await Promise.all([
      query.limit(pageSize).offset(offset).orderBy(desc(loans.createdAt)),
      db.select({ count: sql<number>`count(*)` }).from(loans)
        .then(result => Number(result[0].count))
    ]);

    return {
      data: items,
      total: totalResults,
      page,
      pageSize,
      totalPages: Math.ceil(totalResults / pageSize)
    };
  }

  async createLoan(data: InsertLoan) {
    const [loan] = await db.insert(loans).values(data).returning();
    return loan;
  }

  // Penalty methods
  async getPenalties({ page = 1, pageSize = 10, search = '', status }: PaginationParams = {}): Promise<PaginatedResult<typeof penalties.$inferSelect>> {
    const offset = (page - 1) * pageSize;
    const conditions: SQL[] = [];
    
    if (search) {
      conditions.push(sql`CAST(${penalties.amount} AS text) LIKE ${`%${search}%`}`);
    }

    if (status === 'paid') {
      conditions.push(sql`${penalties.isPaid} = true`);
    } else if (status === 'unpaid') {
      conditions.push(sql`${penalties.isPaid} = false`);
    } else if (status === 'waived') {
      conditions.push(sql`${penalties.isWaived} = true`);
    }
    
    const baseQuery = db.select().from(penalties);
    const query = conditions.length > 0
      ? baseQuery.where(sql`${and(...conditions)}`)
      : baseQuery;

    const [items, totalResults] = await Promise.all([
      query.limit(pageSize).offset(offset).orderBy(desc(penalties.createdAt)),
      db.select({ count: sql<number>`count(*)` }).from(penalties)
        .then(result => Number(result[0].count))
    ]);

    return {
      data: items,
      total: totalResults,
      page,
      pageSize,
      totalPages: Math.ceil(totalResults / pageSize)
    };
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
    // const totalMembers = await db
    //   .select({ count: sql<number>`count(*)` })
    //   .from(members);

    // const totalContributions = await db
    //   .select({ sum: sql<string>`sum(amount)` })
    //   .from(contributions)
    //   .where(eq(contributions.isPaid, true));

    // const activeLoans = await db
    //   .select({ count: sql<number>`count(*)` })
    //   .from(loans)
    //   .where(eq(loans.status, "active"));

    // const totalPenalties = await db
    //   .select({ sum: sql<string>`sum(amount)` })
    //   .from(penalties)
    //   .where(eq(penalties.isWaived, false));
    const totalMembers = await db
      .select({ count: sql<number>`COUNT(*) AS total` })
      .from(members);

    const totalContributions = await db
      .select({ sum: sql<number>`SUM(amount) AS total` })
      .from(contributions)
      .where(eq(contributions.isPaid, true));

    const activeLoans = await db
      .select({ count: sql<number>`COUNT(*) AS total` })
      .from(loans)
      .where(eq(loans.isRepaid, false));

    const totalPenalties = await db
      .select({ sum: sql<number>`SUM(amount) AS total` })
      .from(penalties)
      .where(eq(penalties.isWaived, false));

    const result = {
      totalMembers: Number(totalMembers[0]?.count) || 0,
      totalContributions: Number(totalContributions[0]?.sum) || 0,
      activeLoans: Number(activeLoans[0]?.count) || 0,
      totalPenalties: Number(totalPenalties[0]?.sum) || 0,
    };
    return result;
  }

  // Recent activity
  async getRecentActivity() {
    const recentContributions = await db
      .select({
        type: sql<string>`'contribution'`,
        date: contributions.paymentDate,
        description: sql<string>`'Contribution payment'`,
        amount: contributions.amount,
        memberId: contributions.memberId,
        memberName: members.name,
      })
      .from(contributions)
      .leftJoin(members, eq(contributions.memberId, members.id))
      .where(eq(contributions.isPaid, true))
      .orderBy(desc(contributions.paymentDate))
      .limit(5);

    const recentLoans = await db
      .select({
        type: sql<string>`'loan'`,
        date: loans.issueDate,
        description: sql<string>`'Loan issued'`,
        amount: loans.amount,
        memberId: loans.memberId,
        memberName: members.name,
      })
      .from(loans)
      .leftJoin(members, eq(loans.memberId, members.id))
      .orderBy(desc(loans.issueDate))
      .limit(5);

    // Combine and sort recent activities
    const activities = [...recentContributions, ...recentLoans]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return activities;
  }

  // Report methods
  async getFilteredReportData(filters: any) {
    let data: any[] = [];

    // Get all data
    const [contributionsResult, loansResult, penaltiesResult] = await Promise.all([
      this.getContributions(),
      this.getLoans(),
      this.getPenalties()
    ]);

    // Get all members for lookup
    const allMembers = await db.select().from(members);
    const memberMap = new Map(allMembers.map(m => [m.id, m]));

    // Combine and format data
    const contributionRecords = (contributionsResult.data || []).map((c: any) => {
      const member = memberMap.get(c.memberId);
      let date: Date;
      if (typeof c.paymentDate === 'string' && c.paymentDate) {
        date = new Date(c.paymentDate);
      } else if (typeof c.createdAt === 'string' && c.createdAt) {
        date = new Date(c.createdAt);
      } else {
        date = new Date();
      }
      return {
        type: 'contribution',
        date,
        memberId: c.memberId,
        memberName: member?.name || 'Unknown Member',
        memberEmail: member?.email || '',
        amount: c.amount,
        status: c.isPaid ? 'paid' : 'unpaid',
        notes: c.lateFee ? `Late fee: ${c.lateFee}` : ''
      };
    });

    const loanRecords = (loansResult.data || []).map((l: any) => {
      const member = memberMap.get(l.memberId);
      let date: Date;
      if (typeof l.issueDate === 'string' && l.issueDate) {
        date = new Date(l.issueDate);
      } else {
        date = new Date();
      }
      return {
        type: 'loan',
        date,
        memberId: l.memberId,
        memberName: member?.name || 'Unknown Member',
        memberEmail: member?.email || '',
        amount: l.amount,
        status: l.isRepaid ? 'repaid' : 'active',
        notes: l.notes || ''
      };
    });

    const penaltyRecords = (penaltiesResult.data || []).map((p: any) => {
      const member = memberMap.get(p.memberId);
      let date: Date;
      if (typeof p.appliedDate === 'string' && p.appliedDate) {
        date = new Date(p.appliedDate);
      } else {
        date = new Date();
      }
      return {
        type: 'penalty',
        date,
        memberId: p.memberId,
        memberName: member?.name || 'Unknown Member',
        memberEmail: member?.email || '',
        amount: p.amount,
        status: p.isPaid ? 'paid' : p.isWaived ? 'waived' : 'outstanding',
        notes: p.reason || ''
      };
    });

    data = [...contributionRecords, ...loanRecords, ...penaltyRecords];

    // Apply filters
    if (filters.member !== "all") {
      data = data.filter(item => item.memberId === parseInt(filters.member));
    }

    if (filters.month !== "all") {
      data = data.filter(item => {
        const itemDate = item.date;
        return itemDate.toISOString().slice(0, 7) === filters.month;
      });
    }

    if (filters.type !== "all") {
      data = data.filter(item => item.type === filters.type);
    }

    if (filters.status !== "all") {
      data = data.filter(item => item.status === filters.status);
    }

    return data.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}

export const storage = new Storage();