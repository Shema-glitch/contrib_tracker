import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, Mail, AlertTriangle, CheckCircle, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Penalties() {
  const [penaltyFilter, setPenaltyFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: penalties, isLoading: penaltiesLoading } = useQuery({
    queryKey: ["/api/penalties"],
  });

  const { data: members } = useQuery({
    queryKey: ["/api/members"],
  });

  const updatePenaltyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest("PATCH", `/api/penalties/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/penalties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Penalty updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update penalty",
        variant: "destructive",
      });
    },
  });

  const filteredPenalties = penalties?.filter((penalty: any) => {
    if (penaltyFilter === "all") return true;
    if (penaltyFilter === "contribution_late") return penalty.type === "contribution_late";
    if (penaltyFilter === "loan_overdue") return penalty.type === "loan_overdue";
    if (penaltyFilter === "outstanding") return !penalty.isPaid && !penalty.isWaived;
    if (penaltyFilter === "resolved") return penalty.isPaid || penalty.isWaived;
    return true;
  }) || [];

  const handleMarkPaid = (penaltyId: number) => {
    updatePenaltyMutation.mutate({
      id: penaltyId,
      updates: { isPaid: true }
    });
  };

  const handleWaivePenalty = (penaltyId: number) => {
    updatePenaltyMutation.mutate({
      id: penaltyId,
      updates: { isWaived: true }
    });
  };

  const handleSendNotice = (penalty: any) => {
    const member = members?.find((m: any) => m.id === penalty.memberId);
    if (member) {
      toast({
        title: "Notice Sent",
        description: `Penalty notice sent to ${member.name}`,
      });
    }
  };

  if (penaltiesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const outstandingPenalties = penalties?.filter((p: any) => !p.isPaid && !p.isWaived) || [];
  const outstandingAmount = outstandingPenalties.reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0);
  
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const collectedThisMonth = penalties?.filter((p: any) => {
    const appliedDate = new Date(p.appliedDate);
    return p.isPaid && appliedDate.getMonth() === thisMonth && appliedDate.getFullYear() === thisYear;
  }) || [];
  const collectedAmount = collectedThisMonth.reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0);
  
  const waivedPenalties = penalties?.filter((p: any) => p.isWaived) || [];
  const waivedAmount = waivedPenalties.reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Penalties Management</h1>
        <p className="text-muted-foreground">Track and manage late payment and loan penalties</p>
      </div>

      {/* Penalty Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="enterprise-stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding Penalties</p>
                <p className="text-3xl font-bold enterprise-warning mt-2">{outstandingAmount.toLocaleString()} RWF</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <AlertTriangle className="inline mr-1 h-3 w-3" />
                  {outstandingPenalties.length} penalty cases
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-orange-600 dark:text-orange-400 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enterprise-stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Collected This Month</p>
                <p className="text-3xl font-bold enterprise-success mt-2">{collectedAmount.toLocaleString()} RWF</p>
                <p className="text-sm enterprise-success mt-1">
                  <CheckCircle className="inline mr-1 h-3 w-3" />
                  {collectedThisMonth.length} penalties resolved
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600 dark:text-green-400 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enterprise-stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Waived Penalties</p>
                <p className="text-3xl font-bold enterprise-danger mt-2">{waivedAmount.toLocaleString()} RWF</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <Ban className="inline mr-1 h-3 w-3" />
                  {waivedPenalties.length} cases waived
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Ban className="text-red-600 dark:text-red-400 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Penalties Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Penalties</CardTitle>
            <Select value={penaltyFilter} onValueChange={setPenaltyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Penalties</SelectItem>
                <SelectItem value="contribution_late">Contribution Late Fees</SelectItem>
                <SelectItem value="loan_overdue">Loan Penalties</SelectItem>
                <SelectItem value="outstanding">Outstanding</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPenalties.map((penalty: any) => {
                const member = members?.find((m: any) => m.id === penalty.memberId);
                
                return (
                  <TableRow key={penalty.id}>
                    <TableCell>
                      <div>
                        <div className="font-bold">{member?.name || 'Unknown Member'}</div>
                        <div className="text-sm text-muted-foreground">
                          {penalty.type === "contribution_late" ? "Late contribution" : "Overdue loan"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={penalty.type === "contribution_late" ? "secondary" : "destructive"}>
                        {penalty.type === "contribution_late" ? "Late Fee" : "Loan Penalty"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(penalty.appliedDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold enterprise-warning">
                      {parseFloat(penalty.amount).toLocaleString()} RWF
                    </TableCell>
                    <TableCell>{penalty.reason}</TableCell>
                    <TableCell>
                      <Badge variant={
                        penalty.isPaid ? "default" : 
                        penalty.isWaived ? "secondary" : 
                        "destructive"
                      }>
                        {penalty.isPaid ? "Paid" : penalty.isWaived ? "Waived" : "Outstanding"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!penalty.isPaid && !penalty.isWaived && (
                            <>
                              <DropdownMenuItem onClick={() => handleMarkPaid(penalty.id)}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleWaivePenalty(penalty.id)}>
                                <X className="mr-2 h-4 w-4" />
                                Waive Penalty
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleSendNotice(penalty)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Notice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredPenalties.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No penalties found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
