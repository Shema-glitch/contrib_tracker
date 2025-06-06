import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const memberStatusEnum = pgEnum('member_status', ['active', 'inactive', 'suspended']);
export const contributionStatusEnum = pgEnum('contribution_status', ['paid', 'unpaid', 'late', 'penalty_applied']);
export const loanStatusEnum = pgEnum('loan_status', ['active', 'repaid', 'overdue', 'defaulted']);
export const penaltyTypeEnum = pgEnum('penalty_type', ['late_contribution', 'overdue_loan']);
export const penaltyStatusEnum = pgEnum('penalty_status', ['outstanding', 'paid', 'waived']);

// Admin users table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// OTP sessions table
export const otpSessions = pgTable("otp_sessions", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Members table (predefined, fixed member base)
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  memberId: varchar("member_id", { length: 50 }).notNull().unique(),
  status: memberStatusEnum("status").default('active'),
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Monthly contributions table
export const contributions = pgTable("contributions", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // Format: YYYY-MM
  amount: decimal("amount", { precision: 10, scale: 2 }).default('5000.00'),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0.00'),
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }).default('0.00'),
  status: contributionStatusEnum("status").default('unpaid'),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loans table
export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  issuedAt: timestamp("issued_at").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  repaidAmount: decimal("repaid_amount", { precision: 10, scale: 2 }).default('0.00'),
  penalty: decimal("penalty", { precision: 10, scale: 2 }).default('0.00'),
  status: loanStatusEnum("status").default('active'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Penalties table
export const penalties = pgTable("penalties", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  type: penaltyTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: penaltyStatusEnum("status").default('outstanding'),
  appliedAt: timestamp("applied_at").defaultNow(),
  paidAt: timestamp("paid_at"),
  waivedAt: timestamp("waived_at"),
  contributionId: integer("contribution_id").references(() => contributions.id),
  loanId: integer("loan_id").references(() => loans.id),
});

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email notifications log
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  to: varchar("to", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).default('sent'),
  sentAt: timestamp("sent_at").defaultNow(),
  memberId: integer("member_id").references(() => members.id),
});

// Relations
export const membersRelations = relations(members, ({ many }) => ({
  contributions: many(contributions),
  loans: many(loans),
  penalties: many(penalties),
  emailLogs: many(emailLogs),
}));

export const contributionsRelations = relations(contributions, ({ one, many }) => ({
  member: one(members, {
    fields: [contributions.memberId],
    references: [members.id],
  }),
  penalties: many(penalties),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  member: one(members, {
    fields: [loans.memberId],
    references: [members.id],
  }),
  penalties: many(penalties),
}));

export const penaltiesRelations = relations(penalties, ({ one }) => ({
  member: one(members, {
    fields: [penalties.memberId],
    references: [members.id],
  }),
  contribution: one(contributions, {
    fields: [penalties.contributionId],
    references: [contributions.id],
  }),
  loan: one(loans, {
    fields: [penalties.loanId],
    references: [loans.id],
  }),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  member: one(members, {
    fields: [emailLogs.memberId],
    references: [members.id],
  }),
}));

// Insert schemas
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  createdAt: true,
});

export const insertPenaltySchema = createInsertSchema(penalties).omit({
  id: true,
  appliedAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  sentAt: true,
});

// Types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;

export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = z.infer<typeof insertContributionSchema>;

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;

export type Penalty = typeof penalties.$inferSelect;
export type InsertPenalty = z.infer<typeof insertPenaltySchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;

export type OtpSession = typeof otpSessions.$inferSelect;
