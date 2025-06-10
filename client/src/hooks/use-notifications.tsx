import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiRequest } from "@/lib/queryClient";

export type Notification = {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  createdAt: string;
  is_read: boolean;
};

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotifications = create<NotificationStore>()(
  devtools((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
      set({ isLoading: true });
      try {
        const response = await apiRequest("GET", "/api/notifications");
        const notifications = response.notifications || [];
        const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;
        set({ notifications, unreadCount });
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        set({ isLoading: false });
      }
    },

    markAsRead: async (id: number) => {
      try {
        await apiRequest("POST", `/api/notifications/${id}/read`);
        const notifications = get().notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        );
        const unreadCount = notifications.filter((n) => !n.is_read).length;
        set({ notifications, unreadCount });
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },

    markAllAsRead: async () => {
      try {
        await apiRequest("POST", "/api/notifications/mark-all-read");
        const notifications = get().notifications.map((n) => ({ ...n, is_read: true }));
        set({ notifications, unreadCount: 0 });
      } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
      }
    },
  }))
);
