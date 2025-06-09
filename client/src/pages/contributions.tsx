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
  email: string;
  isActive: boolean;
}

interface Contribution {
  id: number;
  memberId: number;
  amount: string;
  month: string;
  paymentDate: string | null;
  isPaid: boolean;
}

export default function Contributions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: contributionsResponse, isLoading: isLoadingContributions } = useQuery<PaginatedResponse<Contribution>>({
    queryKey: ["contributions", page, pageSize, searchQuery, monthFilter],
    queryFn: async () => {
      const response = await fetch(
        `/api/contributions?page=${page}&pageSize=${pageSize}&search=${searchQuery}&month=${monthFilter}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch contributions");
      }
      return response.json();
    },
  });

  const { data: membersResponse, isLoading: isLoadingMembers } = useQuery<PaginatedResponse<Member>>({
    queryKey: ["members"],
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

  const members = membersResponse?.data || [];
  const contributions = contributionsResponse?.data || [];
  const isLoading = isLoadingContributions || isLoadingMembers;

  const getMemberName = (memberId: number) => {
    const member = members.find((m) => m.id === memberId);
    return member ? member.name : "Unknown Member";
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contributions</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="max-w-sm"
            />
            <Select
              value={monthFilter}
              onValueChange={setMonthFilter}
            >
              <SelectTrigger className="w-[180px] ml-2">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="current">Current Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : contributions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No contributions found
                  </TableCell>
                </TableRow>
              ) : (
                contributions.map((contribution) => (
                  <TableRow key={contribution.id}>
                    <TableCell>{getMemberName(contribution.memberId)}</TableCell>
                    <TableCell>${contribution.amount}</TableCell>
                    <TableCell>{new Date(contribution.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</TableCell>
                    <TableCell>
                      {contribution.paymentDate
                        ? new Date(contribution.paymentDate).toLocaleDateString()
                        : "Not paid"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={contribution.isPaid ? "success" : "destructive"}
                      >
                        {contribution.isPaid ? "Paid" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(Number(value))}
              >
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
                Showing {((page - 1) * pageSize) + 1} to{" "}
                {Math.min(page * pageSize, contributionsResponse?.total || 0)} of{" "}
                {contributionsResponse?.total || 0}
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
                disabled={!contributionsResponse || page >= contributionsResponse.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showPaymentModal && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
        />
      )}
    </div>
  );
}
