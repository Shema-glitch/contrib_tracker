import { toast } from "sonner";

export function useContributions() {
  const createContribution = async (data: CreateContribution) => {
    try {
      const response = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create contribution");
      }

      const result = await response.json();
      toast.success("Contribution recorded successfully!");
      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record contribution");
      throw error;
    }
  };

  const updateContribution = async (id: number, data: UpdateContribution) => {
    try {
      const response = await fetch(`/api/contributions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update contribution");
      }

      const result = await response.json();
      toast.success("Contribution updated successfully!");
      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update contribution");
      throw error;
    }
  };

  const deleteContribution = async (id: number) => {
    try {
      const response = await fetch(`/api/contributions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete contribution");
      }

      toast.success("Contribution deleted successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete contribution");
      throw error;
    }
  };
} 