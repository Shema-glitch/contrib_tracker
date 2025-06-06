import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Info } from "lucide-react";

const loanSchema = z.object({
  memberId: z.number({ required_error: "Please select a member" }),
  amount: z.string().min(1, "Please enter loan amount"),
  issueDate: z.string().min(1, "Please select issue date"),
  dueDate: z.string().min(1, "Please select due date"),
  notes: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanSchema>;

interface LoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoanModal({ open, onOpenChange }: LoanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members } = useQuery({
    queryKey: ["/api/members"],
  });

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months from now
    },
  });

  const createLoanMutation = useMutation({
    mutationFn: async (data: LoanFormData) => {
      return apiRequest("POST", "/api/loans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Loan created successfully and approval email sent",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create loan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoanFormData) => {
    createLoanMutation.mutate(data);
  };

  const selectedMemberId = form.watch("memberId");
  const selectedMember = members?.find((m: any) => m.id === selectedMemberId);
  const isEligible = selectedMember ? parseFloat(selectedMember.totalContributions || "0") >= 30000 : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Loan</DialogTitle>
          <DialogDescription>
            Issue and manage member loans with eligibility verification
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Member</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose eligible member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members?.map((member: any) => {
                          const totalContributions = parseFloat(member.totalContributions || "0");
                          const eligible = totalContributions >= 30000;
                          return (
                            <SelectItem 
                              key={member.id} 
                              value={member.id.toString()}
                              disabled={!eligible}
                            >
                              {member.name} ({totalContributions.toLocaleString()} RWF)
                              {!eligible && " - Not Eligible"}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Amount (RWF)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedMember && (
              <Alert variant={isEligible ? "default" : "destructive"}>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {isEligible ? (
                    <>
                      Member is eligible for loans. Total contributions: {parseFloat(selectedMember.totalContributions || "0").toLocaleString()} RWF
                    </>
                  ) : (
                    <>
                      Member is not eligible for loans. Minimum 30,000 RWF contribution required. 
                      Current: {parseFloat(selectedMember.totalContributions || "0").toLocaleString()} RWF
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Late repayment will incur a 30,000 RWF penalty. Approval email will be sent to member.
              </AlertDescription>
            </Alert>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createLoanMutation.isPending || !isEligible}
              >
                {createLoanMutation.isPending ? "Creating..." : "Add Loan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
