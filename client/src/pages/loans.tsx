import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, MoreHorizontal, Eye, DollarSign, AlertTriangle, HandHeart, TrendingUp, CheckCircle } from "lucide-react";
import LoanModal from "@/components/modals/loan-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Loans() {
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanFilter, setLoanFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans"],
  });

  const { data: members } = useQuery({
    queryKey: ["/api/members"],
  });

  const updateLoanMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest("PATCH", `/api/loans/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Loan updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update loan",
        variant: "destructive",
      });
    },
  });

  const filteredLoans = loans?.filter((loan: any) => {
    if (loanFilter === "all") return true;
    if (loanFilter === "active") return !loan.isRepaid;
    if (loanFilter === "overdue") {
      const dueDate = new Date(loan.dueDate);
      const today = new Date();
      return !loan.isRepaid && dueDate < today;
    }
    if (loanFilter === "repaid") return loan.isRepaid;
    return true;
  }) || [];

  const handleMarkRepaid = (loanId: number) => {
    updateLoanMutation.mutate({
      id: loanId,
      updates: { isRepaid: true, repaidAmount: loans?.find((l: any) => l.id === loanId)?.amount }
    });
  };

  const handleApplyPenalty = (loanId: number) => {
    const loan = loans?.find((l: any) => l.id === loanId);
    if (loan) {
      updateLoanMutation.mutate({
        id: loanId,
        updates: { penalty: "30000" }
      });
    }
  };

  if (loansLoading) {
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

  const activeLoans = loans?.filter((l: any) => !l.isRepaid).length || 0;
  const overdueLoans = loans?.filter((l: any) => {
    const dueDate = new Date(l.dueDate);
    const today = new Date();
    return !l.isRepaid && dueDate < today;
  }).length || 0;
  const repaidThisMonth = loans?.filter((l: any) => {
    const repaidDate = new Date(l.updatedAt || l.createdAt);
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    return l.isRepaid && repaidDate.getMonth() === thisMonth && repaidDate.getFullYear() === thisYear;
  }).length || 0;

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Loan Management</h1>
            <p className="text-muted-foreground">Issue and manage member loans with eligibility verification</p>
          </div>
          <Button onClick={() => setShowLoanModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Loan
          </Button>
        </div>

        {/* Loan Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="enterprise-stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Loans</p>
                  <p className="text-3xl font-bold text-primary mt-2">{activeLoans}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <HandHeart className="inline mr-1 h-3 w-3" />
                    Total: {loans?.filter((l: any) => !l.isRepaid).reduce((sum: number, l: any) => sum + parseFloat(l.amount || "0"), 0).toLocaleString()} RWF
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <HandHeart className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enterprise-stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Loans</p>
                  <p className="text-3xl font-bold enterprise-warning mt-2">{overdueLoans}</p>
                  <p className="text-sm enterprise-warning mt-1">
                    <AlertTriangle className="inline mr-1 h-3 w-3" />
                    Penalties: {(overdueLoans * 30000).toLocaleString()} RWF
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
                  <p className="text-sm font-medium text-muted-foreground">Repaid This Month</p>
                  <p className="text-3xl font-bold enterprise-success mt-2">{repaidThisMonth}</p>
                  <p className="text-sm enterprise-success mt-1">
                    <CheckCircle className="inline mr-1 h-3 w-3" />
                    Performance tracking
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600 dark:text-green-400 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loans Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Loan Records</CardTitle>
              <Select value={loanFilter} onValueChange={setLoanFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Loans</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="repaid">Repaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Penalties</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.map((loan: any) => {
                  const member = members?.find((m: any) => m.id === loan.memberId);
                  const dueDate = new Date(loan.dueDate);
                  const today = new Date();
                  const isOverdue = !loan.isRepaid && dueDate < today;
                  const penaltyAmount = parseFloat(loan.penalty || "0");

                  return (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div>
                          <div className="font-bold">{member?.name || 'Unknown Member'}</div>
                          <div className="text-sm text-muted-foreground">
                            Total contributed: {parseFloat(member?.totalContributions || "0").toLocaleString()} RWF
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {parseFloat(loan.amount).toLocaleString()} RWF
                      </TableCell>
                      <TableCell>{new Date(loan.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{dueDate.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          loan.isRepaid ? "default" : 
                          isOverdue ? "destructive" : 
                          "secondary"
                        }>
                          {loan.isRepaid ? "Repaid" : isOverdue ? "Overdue" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {penaltyAmount > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            {penaltyAmount.toLocaleString()} RWF
                          </span>
                        ) : (
                          "0 RWF"
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {!loan.isRepaid && (
                              <DropdownMenuItem onClick={() => handleMarkRepaid(loan.id)}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Record Repayment
                              </DropdownMenuItem>
                            )}
                            {isOverdue && penaltyAmount === 0 && (
                              <DropdownMenuItem onClick={() => handleApplyPenalty(loan.id)}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Apply Penalty
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {filteredLoans.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No loans found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LoanModal open={showLoanModal} onOpenChange={setShowLoanModal} />
    </>
  );
}
