import React from 'react';
import { Loader2 } from 'lucide-react';
import { useConnectionState } from '@/hooks/use-connection-state';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message, className }: LoadingOverlayProps) {
  const { isOnline, backendHealth, isLoading, retryCount } = useConnectionState();

  // Don't show if nothing is loading
  if (!isLoading && backendHealth.isHealthy && isOnline) {
    return null;
  }

  let statusMessage = message;

  // Override message based on connection state
  if (!isOnline) {
    statusMessage = 'You are offline. Please check your internet connection...';
  } else if (!backendHealth.isHealthy) {
    statusMessage = backendHealth.message || 'Connecting to server...';
  } else if (retryCount > 0) {
    statusMessage = `Retrying... (Attempt ${retryCount})`;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-col items-center space-y-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {statusMessage && (
          <p className="text-sm text-muted-foreground max-w-xs">{statusMessage}</p>
        )}
      </div>
    </div>
  );
}