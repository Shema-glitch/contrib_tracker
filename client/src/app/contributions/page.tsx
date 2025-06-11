import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMembers } from "@/hooks/use-members";
import { useContributions } from "@/hooks/use-contributions";

export default function ContributionsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { members, isLoading: membersLoading } = useMembers();
  const { contributions, isLoading: contributionsLoading, refetch } = useContributions();
  const [selectedMember, setSelectedMember] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !amount || !month) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: parseInt(selectedMember),
          amount: parseFloat(amount),
          month: month,
          dueDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create contribution");
      }

      toast.success("Contribution recorded successfully!");
      setSelectedMember("");
      setAmount("");
      setMonth("");
      refetch();
    } catch (error) {
      console.error("Error creating contribution:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create contribution");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (contributionId: number) => {
    try {
      const response = await fetch(`/api/contributions/${contributionId}/pay`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to mark contribution as paid");
      }

      toast.success("Contribution marked as paid!");
      refetch();
    } catch (error) {
      console.error("Error marking contribution as paid:", error);
      toast.error(error instanceof Error ? error.message : "Failed to mark contribution as paid");
    }
  };

  // ... rest of the component code ...
} 