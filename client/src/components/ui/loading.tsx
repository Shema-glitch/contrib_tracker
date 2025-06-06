import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({ className, size = "md" }: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Outer ring */}
        <div className="absolute inset-0 border-2 border-slate-200 dark:border-slate-700 rounded-full" />
        
        {/* Animated arc */}
        <div className="absolute inset-0 border-2 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin" 
             style={{ animationDuration: "1s" }} />
        
        {/* Inner circle */}
        <div className="absolute inset-1 bg-white dark:bg-slate-900 rounded-full" />
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-500 rounded-full" />
      </div>
    </div>
  );
} 