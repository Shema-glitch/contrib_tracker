import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Search, MoreHorizontal, Eye, CreditCard, HandHeart, Mail } from "lucide-react";
import { MemberDetailsModal } from "@/components/modals/member-details-modal";
import { RecordPaymentModal } from "@/components/modals/record-payment-modal";

interface Member {
  id: number;
  name: string;
  memberId: string;
  email: string;
  totalContributions: string;
  isActive: boolean;
}

export default function Members() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
    queryFn: async () => {
      const response = await fetch("/api/members", {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      return response.json();
    }
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const response = await fetch(`/api/members/${memberId}/send-reminder`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send reminder");
      }
      
      return response.json();
    },
    onSuccess: (_, memberId) => {
      toast({
        title: "Reminder Sent",
        description: "Contribution reminder has been sent to the member.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (memberId: number) => {
    setSelectedMemberId(memberId);
    setDetailsModalOpen(true);
  };

  const handleRecordPayment = (memberId: number) => {
    setSelectedMemberId(memberId);
    setPaymentModalOpen(true);
  };

  const handleSendReminder = async (memberId: number) => {
    await sendReminderMutation.mutate(memberId);
  };

  const filteredMembers = members?.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.memberId.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === "all") return true;
    if (statusFilter === "eligible") return parseFloat(member.totalContributions || "0") >= 30000;
    if (statusFilter === "not-eligible") return parseFloat(member.totalContributions || "0") < 30000;
    
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Members Management</h1>
            <p className="text-muted-foreground">Manage fixed member base and track their contributions</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="eligible">Loan Eligible</SelectItem>
                <SelectItem value="not-eligible">Not Eligible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Members Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Total Contributed</TableHead>
                  <TableHead>Loan Eligibility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const totalContributions = parseFloat(member.totalContributions || "0");
                  const isLoanEligible = totalContributions >= 30000;
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-medium text-sm">
                              {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold">{member.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {member.memberId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {totalContributions.toLocaleString()} RWF
                      </TableCell>
                      <TableCell>
                        <Badge variant={isLoanEligible ? "default" : "destructive"}>
                          {isLoanEligible ? "Eligible" : "Not Eligible"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.isActive ? "default" : "secondary"}>
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(member.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRecordPayment(member.id)}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendReminder(member.id)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Reminder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <MemberDetailsModal
        memberId={selectedMemberId}
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedMemberId(null);
        }}
      />

      <RecordPaymentModal
        memberId={selectedMemberId}
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedMemberId(null);
        }}
      />
    </>
  );
}
