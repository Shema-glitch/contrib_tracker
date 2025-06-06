import { useLocation } from "wouter";
import { Bell, Plus, DollarSign } from "lucide-react";
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
      <header className="bg-white dark:bg-card shadow-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Home</span>
            <span>/</span>
            <span className="text-foreground font-medium">{currentPage}</span>
          </nav>

          {/* Header Actions */}
          <div className="flex items-center space-x-4">
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
                    <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-sm font-medium">5 members have overdue contributions</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                    <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm font-medium">2 loans are past due</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Actions */}
            <Button onClick={() => setShowPaymentModal(true)} className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
            <Button onClick={() => setShowLoanModal(true)} variant="secondary" className="hidden sm:flex">
              <DollarSign className="h-4 w-4 mr-2" />
              Add Loan
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">A</span>
                  </div>
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
      </header>

      <PaymentModal open={showPaymentModal} onOpenChange={setShowPaymentModal} />
      <LoanModal open={showLoanModal} onOpenChange={setShowLoanModal} />
    </>
  );
}
