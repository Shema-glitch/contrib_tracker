import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { notifications } from "../shared/schema";
import { Router, Request, Response } from "express";
import { storage } from "./storage";

// Augment the Express interfaces to include custom session properties
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      email: string;
    };
  }
}

const router = Router();

// Get notifications
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    console.log("Fetching notifications for userId:", userId);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const notificationsList = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    console.log("Raw notifications from DB:", notificationsList);

    // The data field is already a JSON object since we're using jsonb
    const formattedNotifications = notificationsList.map(notification => ({
      ...notification,
      data: notification.data || {}
    }));

    console.log("Formatted notifications to send:", formattedNotifications);

    res.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.post("/:id/read", async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    await db
      .update(notifications)
      .set({ is_read: true })
      .where(and(eq(notifications.id, parseInt(id)), eq(notifications.userId, userId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.post("/mark-all-read", async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await db
      .update(notifications)
      .set({ is_read: true })
      .where(eq(notifications.userId, userId));

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// Test endpoint to create a notification
router.post("/test", async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const notification = await storage.createTestNotification(userId);
    if (!notification) {
      return res.status(500).json({ error: "Failed to create test notification" });
    }

    // The data field is already a JSON object since we're using jsonb
    const formattedNotification = {
      ...notification,
      data: notification.data || {}
    };

    res.json({ notification: formattedNotification });
  } catch (error) {
    console.error("Failed to create test notification:", error);
    res.status(500).json({ error: "Failed to create test notification" });
  }
});

export default router;
