import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "primary" | "secondary";
}

export function Loading({ className, size = "md", variant = "default" }: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const variantClasses = {
    default: "border-slate-200 dark:border-slate-700 border-t-slate-600 dark:border-t-slate-400",
    primary: "border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400",
    secondary: "border-slate-200 dark:border-slate-700 border-t-slate-400 dark:border-t-slate-500",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Outer ring */}
        <div className={cn(
          "absolute inset-0 border-2 rounded-full animate-spin",
          variantClasses[variant]
        )} 
        style={{ animationDuration: "0.8s" }} />
        
        {/* Inner circle */}
        <div className="absolute inset-1 bg-white dark:bg-slate-900 rounded-full" />
        
        {/* Center dot */}
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full",
          variant === "primary" ? "bg-blue-600 dark:bg-blue-400" : "bg-slate-600 dark:bg-slate-400"
        )} />
      </div>
    </div>
  );
} 