import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  HandHeart, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Coins
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/members", icon: Users },
  { name: "Contributions", href: "/contributions", icon: CreditCard },
  { name: "Loans", href: "/loans", icon: HandHeart },
  { name: "Penalties", href: "/penalties", icon: AlertTriangle },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-sidebar shadow-lg border-r border-sidebar-border">
        {/* Logo and Title */}
        <div className="flex items-center flex-shrink-0 px-6 pb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Coins className="text-primary-foreground text-lg" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-sidebar-foreground">FinanceFlow</h1>
              <p className="text-xs text-muted-foreground">Enterprise Manager</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-sidebar-primary"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">A</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-sidebar-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
