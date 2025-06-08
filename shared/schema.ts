import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, date, json, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Members table
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  memberId: varchar("member_id", { length: 20 }).notNull().unique(),
  joinDate: date("join_date").notNull(),
  totalContributions: decimal("total_contributions", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contributions table
export const contributions = pgTable("contributions", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date"),
  dueDate: date("due_date").notNull(),
  isPaid: boolean("is_paid").default(false),
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loans table
export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  repaidAmount: decimal("repaid_amount", { precision: 10, scale: 2 }).default("0"),
  isRepaid: boolean("is_repaid").default(false),
  penalty: decimal("penalty", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Penalties table
export const penalties = pgTable("penalties", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'contribution_late' or 'loan_overdue'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  appliedDate: date("applied_date").notNull(),
  isPaid: boolean("is_paid").default(false),
  isWaived: boolean("is_waived").default(false),
  reason: text("reason").notNull(),
  relatedId: integer("related_id"), // contribution_id or loan_id
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => members.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  is_read: boolean("is_read").default(false),
  data: jsonb("data").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
});

// OTP tokens table
export const otpTokens = pgTable("otp_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: varchar("token", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  is_used: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull()
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  passwordHash: text("password_hash"),
  otpHash: text("otp_hash"),
  otpExpiresAt: timestamp("otp_expires_at"),
});

// Schema for inserting notifications
export const insertNotificationSchema = createInsertSchema(notifications);

// Relations
export const membersRelations = relations(members, ({ many }) => ({
  contributions: many(contributions),
  loans: many(loans),
  penalties: many(penalties),
  notifications: many(notifications),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  member: one(members, {
    fields: [contributions.memberId],
    references: [members.id],
  }),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  member: one(members, {
    fields: [loans.memberId],
    references: [members.id],
  }),
}));

export const penaltiesRelations = relations(penalties, ({ one }) => ({
  member: one(members, {
    fields: [penalties.memberId],
    references: [members.id],
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  member: one(members, {
    fields: [notifications.userId],
    references: [members.id],
  }),
}));

// Insert schemas
export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  totalContributions: true,
  createdAt: true,
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  repaidAmount: true,
  isRepaid: true,
  penalty: true,
  createdAt: true,
});

export const insertPenaltySchema = createInsertSchema(penalties).omit({
  id: true,
  createdAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Penalty = typeof penalties.$inferSelect;
export type InsertPenalty = z.infer<typeof insertPenaltySchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type OtpToken = typeof otpTokens.$inferSelect;
