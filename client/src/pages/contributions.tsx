import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Plus } from "lucide-react";
import PaymentModal from "@/components/modals/payment-modal";

export default function Contributions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: contributions, isLoading } = useQuery({
    queryKey: ["/api/contributions"],
  });

  const { data: members } = useQuery({
    queryKey: ["/api/members"],
  });

  const filteredContributions = contributions?.filter((contribution: any) => {
    const member = members?.find((m: any) => m.id === contribution.memberId);
    const memberName = member?.name || '';
    
    const matchesSearch = memberName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (monthFilter === "all") return true;
    if (monthFilter === "current") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return contribution.month === currentMonth;
    }
    
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
            <h1 className="text-2xl font-bold">Contributions Management</h1>
            <p className="text-muted-foreground">Track and manage monthly member contributions</p>
          </div>
          <Button onClick={() => setShowPaymentModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="current">Current Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contribution Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Late Fee</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContributions.map((contribution: any) => {
                  const member = members?.find((m: any) => m.id === contribution.memberId);
                  const isLate = contribution.paymentDate && new Date(contribution.paymentDate) > new Date(contribution.dueDate);
                  
                  return (
                    <TableRow key={contribution.id}>
                      <TableCell>
                        <div className="font-medium">{member?.name || 'Unknown Member'}</div>
                        <div className="text-sm text-muted-foreground">ID: {member?.memberId}</div>
                      </TableCell>
                      <TableCell>{contribution.month}</TableCell>
                      <TableCell className="font-semibold">
                        {parseFloat(contribution.amount).toLocaleString()} RWF
                      </TableCell>
                      <TableCell>{new Date(contribution.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {contribution.paymentDate ? 
                          new Date(contribution.paymentDate).toLocaleDateString() : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        {parseFloat(contribution.lateFee || "0") > 0 ? (
                          <span className="text-orange-600 font-medium">
                            {parseFloat(contribution.lateFee).toLocaleString()} RWF
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          contribution.isPaid ? 
                            (isLate ? "secondary" : "default") : 
                            "destructive"
                        }>
                          {contribution.isPaid ? 
                            (isLate ? "Paid Late" : "Paid") : 
                            "Unpaid"
                          }
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {filteredContributions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No contribution records found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PaymentModal open={showPaymentModal} onOpenChange={setShowPaymentModal} />
    </>
  );
}
