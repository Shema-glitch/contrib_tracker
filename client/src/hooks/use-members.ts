import { useQuery } from "@tanstack/react-query";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Member {
  id: number;
  name: string;
  memberId: string;
  email: string;
  isActive: boolean;
  totalContributions: string;
}

export function useMembers(pageSize = 1000) {
  const { data: response, isLoading, error } = useQuery<PaginatedResponse<Member>>({
    queryKey: ["members", { pageSize }],
    queryFn: async () => {
      const response = await fetch(`/api/members?pageSize=${pageSize}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      return response.json();
    },
  });

  return {
    members: response?.data || [],
    isLoading,
    error,
    total: response?.total || 0,
    totalPages: response?.totalPages || 0
  };
}
