import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Contribution {
  id: number;
  month: string;
  amount: string;
  paymentDate: string;
  dueDate: string;
  isPaid: boolean;
  lateFee: string;
}

interface Loan {
  id: number;
  amount: string;
  issueDate: string;
  dueDate: string;
  repaidAmount: string;
  isRepaid: boolean;
  penalty: string;
  notes: string;
}

interface Member {
  id: number;
  name: string;
  email: string;
  memberId: string;
  joinDate: string;
  totalContributions: string;
  isActive: boolean;
  contributions: Contribution[];
  loans: Loan[];
}

interface MemberDetailsModalProps {
  memberId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MemberDetailsModal({ memberId, isOpen, onClose }: MemberDetailsModalProps) {  const { data: member, isLoading } = useQuery<Member>({
    queryKey: [`/api/members/${memberId}`],
    queryFn: async () => {
      if (!memberId) return null;
      const response = await fetch(`/api/members/${memberId}`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch member details");
      }
      const data = await response.json();
      // Ensure contributions, loans, and penalties are arrays even if null/undefined
      return {
        ...data,
        contributions: data.contributions || [],
        loans: data.loans || [],
        penalties: data.penalties || []
      };
    },
    enabled: !!memberId && isOpen
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString() + " RWF";
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
          <DialogDescription>View member information, contributions, and loans</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        ) : member ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contributions">Contributions</TabsTrigger>
              <TabsTrigger value="loans">Loans</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Member Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="text-lg">{member.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Member ID</p>
                      <p className="text-lg">{member.memberId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-lg">{member.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Join Date</p>
                      <p className="text-lg">{formatDate(member.joinDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Contributions</p>
                      <p className="text-lg">{formatAmount(member.totalContributions)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant={member.isActive ? "default" : "destructive"}>
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contributions">
              <Card>
                <CardHeader>
                  <CardTitle>Contribution History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {member.contributions.map((contribution) => (
                      <Card key={contribution.id}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Month</p>
                              <p>{contribution.month}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Amount</p>
                              <p>{formatAmount(contribution.amount)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                              <p>{contribution.paymentDate ? formatDate(contribution.paymentDate) : 'Not paid'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Status</p>
                              <Badge variant={contribution.isPaid ? "default" : "destructive"}>
                                {contribution.isPaid ? "Paid" : "Pending"}
                              </Badge>
                              {contribution.lateFee !== "0" && (
                                <Badge variant="destructive" className="ml-2">
                                  Late Fee: {formatAmount(contribution.lateFee)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="loans">
              <Card>
                <CardHeader>
                  <CardTitle>Loan History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {member.loans.map((loan) => (
                      <Card key={loan.id}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Amount</p>
                              <p>{formatAmount(loan.amount)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                              <p>{formatDate(loan.issueDate)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                              <p>{formatDate(loan.dueDate)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Status</p>
                              <Badge variant={loan.isRepaid ? "default" : "destructive"}>
                                {loan.isRepaid ? "Repaid" : "Active"}
                              </Badge>
                              {loan.penalty !== "0" && (
                                <Badge variant="destructive" className="ml-2">
                                  Penalty: {formatAmount(loan.penalty)}
                                </Badge>
                              )}
                            </div>
                            {loan.notes && (
                              <div className="col-span-2 md:col-span-4">
                                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                                <p>{loan.notes}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p>No member data found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
