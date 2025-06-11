import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/stats-cards";
import Charts from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Eye, CreditCard, Mail } from "lucide-react";
import { useState } from "react";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Member {
  id: number;
  name: string;
  memberId: string;
  email: string;
  isActive: boolean;
  totalContributions: string;
}

interface DashboardStats {
  totalContributionsThisMonth: string;
  activeLoans: number;
  latePayments: number;
  penaltiesCollected: string;
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  date: string;
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats", {
        credentials: "include",
  });
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return response.json();
    },
  });

  const { data: membersResponse, isLoading: membersLoading } = useQuery<PaginatedResponse<Member>>({
    queryKey: ["members", "dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/members?pageSize=1000", {
        credentials: "include",
  });
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      return response.json();
    },
  });

  const { data: recentActivity } = useQuery<ActivityItem[]>({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/recent-activity", {
        credentials: "include",
  });
      if (!response.ok) {
        throw new Error("Failed to fetch recent activity");
      }
      return response.json();
    },
  });

  const members = membersResponse?.data || [];
  const filteredMembers = searchQuery
    ? members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.memberId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">FundSync Dashboard</h1>
        <p className="text-muted-foreground">Empowering Contributions, Securing Loans, Building Futures.</p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={statsLoading} />

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Charts />
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity?.length === 0 ? (
              <p className="text-center text-muted-foreground">No recent activity</p>
            ) : (
            <div className="space-y-4">
                {recentActivity?.map((activity) => (
                  <div key={`activity-${activity.id}`} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                      </p>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Members Overview</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                <TableHead>Member ID</TableHead>
                <TableHead>Name</TableHead>
                  <TableHead>Total Contributions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {membersLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading members...
                      </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No members found
                      </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.memberId}</TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>${member.totalContributions}</TableCell>
                      <TableCell>
                      <Badge variant={member.isActive ? "default" : "secondary"}>
                        {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        <Button variant="ghost" size="icon">
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                ))
              )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
