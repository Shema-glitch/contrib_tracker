import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMembers } from "@/hooks/use-members";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Info } from "lucide-react";

const paymentSchema = z.object({
  memberId: z.number({ required_error: "Please select a member" }),
  month: z.string().min(1, "Please select a month"),
  amount: z.string().min(1, "Please enter an amount"),
  paymentDate: z.string().min(1, "Please select a payment date"),
  dueDate: z.string().min(1, "Due date is required"),
  isPaid: z.boolean().default(true),
  applyLateFee: z.boolean().default(false),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaymentModal({ open, onOpenChange }: PaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOtp, setShowOtp] = useState(false);

  const { members, isLoading: isLoadingMembers } = useMembers();

  // Fetch contribution amount from settings
  const { data: contributionAmount } = useQuery({
    queryKey: ["/api/settings/contributionAmount"],
    queryFn: async () => {
      const response = await fetch("/api/settings/contributionAmount", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch contribution amount");
      }
      const data = await response.json();
      return data.value || "5000"; // Fallback to 5000 if not set
    },
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: contributionAmount || "5000",
      isPaid: true,
      applyLateFee: false,
      paymentDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  // Update form when contribution amount changes
  useEffect(() => {
    if (contributionAmount) {
      form.setValue("amount", contributionAmount);
    }
  }, [contributionAmount, form]);

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      return apiRequest("POST", "/api/contributions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    // For sensitive operations, show OTP modal first
    setShowOtp(true);
    // For demo purposes, proceed directly
    recordPaymentMutation.mutate(data);
  };

  const applyLateFee = form.watch("applyLateFee");
  const baseAmount = parseFloat(form.watch("amount") || "0");
  const lateFeeAmount = applyLateFee ? 1000 : 0;
  const totalAmount = baseAmount + lateFeeAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record monthly contributions and apply penalties if needed
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Member</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {members?.map((member: any) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Month</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2024-12">December 2024</SelectItem>
                          <SelectItem value="2025-01">January 2025</SelectItem>
                          <SelectItem value="2025-02">February 2025</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (RWF)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applyLateFee"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Apply late fee (1,000 RWF)</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={recordPaymentMutation.isPending}>
                    {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Payment Summary</h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Base Contribution</div>
                <div className="text-2xl font-bold text-primary">
                  {baseAmount.toLocaleString()} RWF
                </div>
              </div>

              {applyLateFee && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm text-orange-600 dark:text-orange-400">Late Fee</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {lateFeeAmount.toLocaleString()} RWF
                  </div>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400">Total Amount</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {totalAmount.toLocaleString()} RWF
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Payment will be recorded and email notification sent to member
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
