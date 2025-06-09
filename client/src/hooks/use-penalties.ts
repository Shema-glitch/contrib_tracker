import { useQuery } from "@tanstack/react-query";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Penalty {
  id: number;
  memberId: number;
  amount: string;
  type: string;
  appliedDate: string;
  isPaid: boolean;
  isWaived: boolean;
  reason: string;
}

interface UsePenaltiesOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export function usePenalties({ 
  page = 1, 
  pageSize = 10, 
  search = '', 
  status = 'all' 
}: UsePenaltiesOptions = {}) {
  const { data: response, isLoading, error } = useQuery<PaginatedResponse<Penalty>>({
    queryKey: ["penalties", { page, pageSize, search, status }],
    queryFn: async () => {
      const response = await fetch(
        `/api/penalties?page=${page}&pageSize=${pageSize}&search=${search}&status=${status}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch penalties");
      }
      return response.json();
    },
  });

  const penalties = response?.data || [];
  
  const stats = {
    outstandingAmount: penalties
      .filter(p => !p.isPaid && !p.isWaived)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
      .toFixed(2),
      
    collectedAmount: penalties
      .filter(p => p.isPaid)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
      .toFixed(2),
      
    waivedAmount: penalties
      .filter(p => p.isWaived)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
      .toFixed(2),
  };

  return {
    penalties,
    isLoading,
    error,
    total: response?.total || 0,
    totalPages: response?.totalPages || 0,
    currentPage: response?.page || page,
    stats,
  };
}
