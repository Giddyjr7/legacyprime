import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DashboardLoadingProps {
  message?: string;
}

export function DashboardLoading({ message = "Loading..." }: DashboardLoadingProps) {
  return (
    <div className="h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}