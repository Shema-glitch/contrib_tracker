import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import MembersPage from "@/pages/members";
import ContributionsPage from "@/pages/contributions";
import LoansPage from "@/pages/loans";
import PenaltiesPage from "@/pages/penalties";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { ThemeProvider } from "next-themes";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function AuthenticatedRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/members" component={MembersPage} />
        <Route path="/contributions" component={ContributionsPage} />
        <Route path="/loans" component={LoansPage} />
        <Route path="/penalties" component={PenaltiesPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={DashboardPage} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {user ? (
        <Route component={AuthenticatedRoutes} />
      ) : (
        <Route component={LoginPage} />
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
