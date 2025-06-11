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
  Coins,
  Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/members", icon: Users },
  { name: "Contributions", href: "/contributions", icon: CreditCard },
  { name: "Loans", href: "/loans", icon: HandHeart },
  { name: "Penalties", href: "/penalties", icon: AlertTriangle },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

const NavItem = ({ item, isActive }: { item: typeof navigation[0]; isActive: boolean }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2 }}
  >
    <Link href={item.href}>
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
  </motion.div>
            );

export default function Sidebar() {
  const [location] = useLocation();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-sidebar shadow-lg border-r border-sidebar-border w-full">
      {/* Logo and Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center flex-shrink-0 px-6 py-4"
      >
        <div className="flex items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"
          >
            <Coins className="text-primary-foreground text-lg" />
          </motion.div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-sidebar-foreground">FundSync</h1>
            <p className="text-xs text-muted-foreground">Contribution Tracker</p>
            {/* <p className="text-xs text-muted-foreground">Enterprise Manager</p> */}
          </div>
        </div>
      </motion.div>

      {/* Navigation Menu */}
      <nav className="mt-6 flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          return <NavItem key={item.name} item={item} isActive={isActive} />;
          })}
        </nav>

        {/* User Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-shrink-0 px-4 py-4 border-t border-sidebar-border"
      >
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">A</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-sidebar-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
      </motion.div>
        </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50 w-10 h-10">
            <Menu className="h-5 w-5 min-w-[20px] min-h-[20px]" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0">
        <SidebarContent />
      </div>
    </>
  );
}
