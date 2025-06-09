import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
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
import { useMembers } from "@/hooks/use-members";
import { usePenalties, type Penalty } from "@/hooks/use-penalties";

export default function Penalties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { members } = useMembers();
  const { 
    penalties,
    isLoading: isLoadingPenalties,
    total,
    totalPages,
    stats 
  } = usePenalties({
    page,
    pageSize,
    search: searchQuery,
    status: statusFilter,
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (penalty: Penalty) => {
      const response = await fetch(`/api/penalties/${penalty.id}/mark-paid`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to mark penalty as paid");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penalties"] });
      toast({
        title: "Success",
        description: "Penalty has been marked as paid.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark penalty as paid.",
        variant: "destructive",
      });
    },
  });

  const waivePenaltyMutation = useMutation({
    mutationFn: async (penalty: Penalty) => {
      const response = await fetch(`/api/penalties/${penalty.id}/waive`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to waive penalty");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penalties"] });
      toast({
        title: "Success",
        description: "Penalty has been waived.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to waive penalty.",
        variant: "destructive",
      });
    },
  });

  const sendNoticeMutation = useMutation({
    mutationFn: async (penalty: Penalty) => {
      const response = await fetch(`/api/penalties/${penalty.id}/send-notice`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to send notice");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Penalty notice has been sent.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send penalty notice.",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsPaid = (penalty: Penalty) => {
    markAsPaidMutation.mutate(penalty);
  };

  const handleWaivePenalty = (penalty: Penalty) => {
    waivePenaltyMutation.mutate(penalty);
  };

  const handleSendNotice = (penalty: Penalty) => {
    sendNoticeMutation.mutate(penalty);
  };

  const outstandingCount = penalties?.filter(p => !p.isPaid && !p.isWaived).length || 0;
  const collectedCount = penalties?.filter(p => p.isPaid).length || 0;
  const waivedCount = penalties?.filter(p => p.isWaived).length || 0;

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
                <p className="text-3xl font-bold enterprise-warning mt-2">{stats.outstandingAmount} RWF</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <AlertTriangle className="inline mr-1 h-3 w-3" />
                  {outstandingCount} penalty cases
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
                <p className="text-3xl font-bold enterprise-success mt-2">{stats.collectedAmount} RWF</p>
                <p className="text-sm enterprise-success mt-1">
                  <CheckCircle className="inline mr-1 h-3 w-3" />
                  {collectedCount} penalties resolved
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
                <p className="text-3xl font-bold enterprise-danger mt-2">{stats.waivedAmount} RWF</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <Ban className="inline mr-1 h-3 w-3" />
                  {waivedCount} cases waived
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              {penalties?.map((penalty: Penalty) => {
                const member = members?.find((m) => m.id === penalty.memberId);
                
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
                      {parseFloat(penalty.amount.toString()).toLocaleString()} RWF
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
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(penalty)}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleWaivePenalty(penalty)}>
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
          
          {(!penalties || penalties.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No penalties found matching your criteria.
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 / page</SelectItem>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total || 0)} of {total || 0}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page >= (totalPages || 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
