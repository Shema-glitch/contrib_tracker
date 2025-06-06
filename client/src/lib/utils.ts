import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateMemberId(): string {
  const prefix = 'MB';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}${timestamp}${random}`;
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export function isLoanEligible(totalContributed: string | number, minRequired: number = 30000): boolean {
  const amount = typeof totalContributed === 'string' ? parseFloat(totalContributed) : totalContributed;
  return amount >= minRequired;
}

export function calculateLoanDueDate(issueDate: Date, termMonths: number = 3): Date {
  const dueDate = new Date(issueDate);
  dueDate.setMonth(dueDate.getMonth() + termMonths);
  return dueDate;
}

export function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1] || '';
}

export function getContributionStatus(contribution: any): {
  status: 'paid' | 'unpaid' | 'late';
  variant: 'success' | 'destructive' | 'warning';
  label: string;
} {
  if (contribution.isPaid) {
    return {
      status: 'paid',
      variant: 'success',
      label: 'Paid'
    };
  }
  
  const now = new Date();
  const dueDate = new Date(contribution.dueDate);
  
  if (now > dueDate) {
    return {
      status: 'late',
      variant: 'destructive',
      label: 'Late'
    };
  }
  
  return {
    status: 'unpaid',
    variant: 'warning',
    label: 'Unpaid'
  };
}

export function getLoanStatus(loan: any): {
  status: 'active' | 'overdue' | 'repaid';
  variant: 'default' | 'destructive' | 'success';
  label: string;
} {
  if (loan.isRepaid) {
    return {
      status: 'repaid',
      variant: 'success',
      label: 'Repaid'
    };
  }
  
  const now = new Date();
  const dueDate = new Date(loan.dueDate);
  
  if (now > dueDate) {
    return {
      status: 'overdue',
      variant: 'destructive',
      label: 'Overdue'
    };
  }
  
  return {
    status: 'active',
    variant: 'default',
    label: 'Active'
  };
}

export function getPenaltyTypeLabel(type: string): string {
  const labels = {
    'contribution_late': 'Late Contribution Fee',
    'loan_overdue': 'Overdue Loan Penalty',
  };
  return labels[type as keyof typeof labels] || type;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function downloadCSV(data: any[], filename: string) {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value
    ).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
