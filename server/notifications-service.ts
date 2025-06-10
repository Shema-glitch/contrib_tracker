import { db } from "./db";
import { notifications } from "../shared/schema";

export type NotificationType = "info" | "warning" | "success" | "error";

export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: NotificationType,
  data?: Record<string, unknown>
) {
  try {
    await db.insert(notifications).values({
      userId,
      title,
      message,
      type,
      is_read: false,
      data: data || {},
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function createNotificationForOverdueContributions(
  userId: string,
  count: number
) {
  const title = "Overdue Contributions";
  const message = `${count} member${count === 1 ? " has" : "s have"} overdue contributions`;
  await createNotification(userId, title, message, "warning");
}

export async function createNotificationForLoanRequest(
  userId: number,
  memberName: string
) {
  const title = "New Loan Request";
  const message = `${memberName} has requested a new loan`;
  await createNotification(userId, title, message, "info");
}

export async function createNotificationForPayment(
  userId: string,
  memberName: string,
  amount: number
) {
  const title = "New Payment";
  const message = `${memberName} has made a payment of $${amount.toFixed(2)}`;
  await createNotification(userId, title, message, "success");
}

export async function createNotificationForDueDateReminder(
  userId: string,
  count: number,
  daysUntilDue: number
) {
  const title = "Upcoming Due Date";
  const message = `${count} member${count === 1 ? " has" : "s have"} contributions due in ${daysUntilDue} days`;
  await createNotification(userId, title, message, "info");
}
