import { useLocation } from "wouter";
import { Bell, Plus, DollarSign, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import PaymentModal from "@/components/modals/payment-modal";
import LoanModal from "@/components/modals/loan-modal";
import { motion, AnimatePresence } from "framer-motion";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/members": "Members",
  "/contributions": "Contributions", 
  "/loans": "Loans",
  "/penalties": "Penalties",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function Header() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);

  const currentPage = breadcrumbMap[location] || "Dashboard";

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-card shadow-sm border-b border-border"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Home</span>
            <span>/</span>
            <span className="text-foreground font-medium">{currentPage}</span>
          </nav>

          {/* Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    3
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-4">
                  <h3 className="font-semibold mb-3">Notifications</h3>
                  <div className="space-y-2">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2 rounded-lg bg-warning/10 border border-warning/20"
                    >
                      <p className="text-sm font-medium">5 members have overdue contributions</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-2 rounded-lg bg-destructive/10 border border-destructive/20"
                    >
                      <p className="text-sm font-medium">2 loans are past due</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </motion.div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Actions */}
            <div className="hidden sm:flex space-x-2">
              <Button onClick={() => setShowPaymentModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
              <Button onClick={() => setShowLoanModal(true)} variant="secondary">
              <DollarSign className="h-4 w-4 mr-2" />
              Add Loan
            </Button>
            </div>

            {/* Mobile Quick Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowPaymentModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowLoanModal(true)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Loan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
      </motion.header>

      <AnimatePresence>
        {showPaymentModal && (
      <PaymentModal open={showPaymentModal} onOpenChange={setShowPaymentModal} />
        )}
        {showLoanModal && (
      <LoanModal open={showLoanModal} onOpenChange={setShowLoanModal} />
        )}
      </AnimatePresence>
    </>
  );
}
