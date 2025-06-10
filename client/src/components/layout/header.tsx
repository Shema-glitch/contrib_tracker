import { useLocation } from "wouter";
import { Bell, Plus, DollarSign, Menu, Check, AlertCircle, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications, type Notification } from "@/hooks/use-notifications";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import PaymentModal from "@/components/modals/payment-modal";
import LoanModal from "@/components/modals/loan-modal";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/members": "Members",
  "/contributions": "Contributions", 
  "/loans": "Loans",
  "/penalties": "Penalties",
  "/reports": "Reports",
  "/settings": "Settings",
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'warning':
    case 'REMINDER_SENT':
      return <AlertCircle className="h-4 w-4 text-warning" />;
    case 'success':
    case 'LOAN_APPROVED':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-primary" />;
  }
}

function getNotificationStyles(type: string) {
  switch (type) {
    case 'warning':
    case 'REMINDER_SENT':
      return 'bg-warning/10 border-warning/20';
    case 'success':
    case 'LOAN_APPROVED':
      return 'bg-success/10 border-success/20';
    case 'error':
      return 'bg-destructive/10 border-destructive/20';
    case 'info':
    default:
      return 'bg-primary/10 border-primary/20';
  }
}

export default function Header() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const { notifications, isLoading, error, markAsRead, markAllAsRead } = useNotifications();

  // Show error toast if notifications fail to load
  useEffect(() => {
    if (error) {
      toast.error('Failed to load notifications');
    }
  }, [error]);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const currentPage = breadcrumbMap[location] || "Dashboard";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white dark:bg-card shadow-sm border-b border-border"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Left section with breadcrumbs */}
        <div className="flex items-center">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground ml-12 md:ml-0">
            <span>Home</span>
            <span>/</span>
            <span className="text-foreground font-medium">{currentPage}</span>
          </nav>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notifications */}
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-2">
                  <h4 className="text-sm font-medium">Notifications</h4>
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="h-8 text-xs"
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-3 rounded-lg border transition-colors cursor-pointer",
                          notification.is_read 
                            ? "bg-muted/50 border-border" 
                            : getNotificationStyles(notification.type),
                          "hover:bg-accent"
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            {notification.data && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {notification.data.memberName && (
                                  <p>Member: {notification.data.memberName}</p>
                                )}
                                {notification.data.amount && (
                                  <p>Amount: {notification.data.amount.toLocaleString()} RWF</p>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(new Date(notification.createdAt))}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Quick Actions */}
          <div className="hidden sm:flex space-x-2">
            {isAuthenticated && (
              <>
                <Button onClick={() => setIsPaymentModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
                <Button onClick={() => setIsLoanModalOpen(true)} variant="secondary">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Loan
                </Button>
              </>
            )}
          </div>

          {/* Mobile Quick Actions */}
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsPaymentModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsLoanModalOpen(true)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Loan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"
                >
                  <span className="text-primary-foreground text-sm font-medium">A</span>
                </motion.div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                Toggle {theme === "dark" ? "Light" : "Dark"} Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AnimatePresence>
        {isPaymentModalOpen && (
          <PaymentModal open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} />
        )}
        {isLoanModalOpen && (
          <LoanModal open={isLoanModalOpen} onOpenChange={setIsLoanModalOpen} />
        )}
      </AnimatePresence>
    </motion.header>
  );
}
