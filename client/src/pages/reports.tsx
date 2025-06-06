import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  FileText, 
  Download, 
  Mail, 
  BarChart3, 
  PieChart,
  Filter,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Reports() {
  const [reportMember, setReportMember] = useState("all");
  const [reportMonth, setReportMonth] = useState("all");
  const [reportType, setReportType] = useState("all");
  const [reportStatus, setReportStatus] = useState("all");
  const [emailAddress, setEmailAddress] = useState("");
  const { toast } = useToast();

  const { data: members } = useQuery({
    queryKey: ["/api/members"],
  });

  const { data: contributions } = useQuery({
    queryKey: ["/api/contributions"],
  });

  const { data: loans } = useQuery({
    queryKey: ["/api/loans"],
  });

  const { data: penalties } = useQuery({
    queryKey: ["/api/penalties"],
  });

  const exportMutation = useMutation({
    mutationFn: async (format: string) => {
      const response = await apiRequest("POST", "/api/reports/export", {
        format,
        filters: {
          member: reportMember,
          month: reportMonth,
          type: reportType,
          status: reportStatus,
        }
      });
      
      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `report-${new Date().toISOString().split('T')[0]}.${format}`;
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report exported successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export report",
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!emailAddress || !emailAddress.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      return apiRequest("POST", "/api/reports/email", {
        format: 'excel', // Default to Excel format for email
        email: emailAddress,
        filters: {
          member: reportMember,
          month: reportMonth,
          type: reportType,
          status: reportStatus,
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report sent via email successfully",
      });
      setEmailAddress(""); // Clear email after successful send
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send report",
        variant: "destructive",
      });
    },
  });

  // Filter data based on selected criteria
  const getFilteredData = () => {
    let data: any[] = [];

    // Combine all data sources
    const contributionRecords = contributions?.map((c: any) => ({
      ...c,
      type: 'contribution',
      date: c.paymentDate || c.createdAt,
      status: c.isPaid ? 'paid' : 'unpaid',
      amount: c.amount,
      member: members?.find((m: any) => m.id === c.memberId),
    })) || [];

    const loanRecords = loans?.map((l: any) => ({
      ...l,
      type: 'loan',
      date: l.issueDate,
      status: l.isRepaid ? 'repaid' : 'active',
      amount: l.amount,
      member: members?.find((m: any) => m.id === l.memberId),
    })) || [];

    const penaltyRecords = penalties?.map((p: any) => ({
      ...p,
      type: 'penalty',
      date: p.appliedDate,
      status: p.isPaid ? 'paid' : p.isWaived ? 'waived' : 'outstanding',
      amount: p.amount,
      member: members?.find((m: any) => m.id === p.memberId),
    })) || [];

    data = [...contributionRecords, ...loanRecords, ...penaltyRecords];

    // Apply filters
    if (reportMember !== "all") {
      data = data.filter(item => item.memberId === parseInt(reportMember));
    }

    if (reportMonth !== "all") {
      data = data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.toISOString().slice(0, 7) === reportMonth;
      });
    }

    if (reportType !== "all") {
      data = data.filter(item => item.type === reportType);
    }

    if (reportStatus !== "all") {
      data = data.filter(item => item.status === reportStatus);
    }

    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredData = getFilteredData();

  const resetFilters = () => {
    setReportMember("all");
    setReportMonth("all");
    setReportType("all");
    setReportStatus("all");
  };

  const handleExport = (format: string) => {
    exportMutation.mutate(format);
  };

  const handleEmailReport = () => {
    sendEmailMutation.mutate();
  };

  const months = [
    "2024-12", "2024-11", "2024-10", "2024-09", 
    "2024-08", "2024-07", "2024-06", "2024-05"
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">FundSync Reports</h1>
        <p className="text-muted-foreground">Generate comprehensive reports and export data</p>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Member</label>
              <Select value={reportMember} onValueChange={setReportMember}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {members?.map((member: any) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Month</label>
              <Select value={reportMonth} onValueChange={setReportMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="contribution">Contributions</SelectItem>
                  <SelectItem value="loan">Loans</SelectItem>
                  <SelectItem value="penalty">Penalties</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Status</label>
              <Select value={reportStatus} onValueChange={setReportStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Actions</label>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                </Button>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => handleExport("csv")} 
              disabled={exportMutation.isPending}
              variant="outline"
              className="enterprise-info"
            >
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </Button>
            <Button 
              onClick={() => handleExport("excel")} 
              disabled={exportMutation.isPending}
              variant="outline"
              className="enterprise-warning"
            >
              <Download className="h-4 w-4 mr-2" />
              Export as Excel
            </Button>
            <div className="flex gap-2 items-center">
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Enter email address"
                className="px-3 py-2 border rounded-md text-sm"
              />
              <Button 
                onClick={handleEmailReport} 
                disabled={sendEmailMutation.isPending || !emailAddress}
                variant="secondary"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Contribution Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center border-2 border-dashed border-muted">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Monthly Contribution Patterns</p>
                <p className="text-sm text-muted-foreground/70">Chart.js integration pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Payment Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center border-2 border-dashed border-muted">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Payment Status Breakdown</p>
                <p className="text-sm text-muted-foreground/70">Pie chart visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Report ({filteredData.length} records)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.slice(0, 50).map((record: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.member?.name || 'Unknown Member'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      record.type === "contribution" ? "default" :
                      record.type === "loan" ? "secondary" :
                      "destructive"
                    }>
                      {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {parseFloat(record.amount).toLocaleString()} RWF
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      record.status === "paid" || record.status === "repaid" ? "default" :
                      record.status === "unpaid" || record.status === "outstanding" ? "destructive" :
                      "secondary"
                    }>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {record.type === "contribution" ? "Monthly contribution" :
                     record.type === "loan" ? `Due: ${new Date(record.dueDate).toLocaleDateString()}` :
                     record.reason || "Penalty applied"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No records found matching your criteria.
            </div>
          )}
          
          {filteredData.length > 50 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Showing first 50 of {filteredData.length} records. Export for complete data.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
