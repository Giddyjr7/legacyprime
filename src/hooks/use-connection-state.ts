import { useState, useEffect } from 'react';
import HealthService, { HealthStatus } from '@/services/healthService';

export interface ConnectionState {
  isOnline: boolean;
  backendHealth: HealthStatus;
  isLoading: boolean;
  retryCount: number;
}

export function useConnectionState() {
  const [state, setState] = useState<ConnectionState>({
    isOnline: navigator.onLine,
    backendHealth: HealthService.getStatus(),
    isLoading: false,
    retryCount: 0
  });

  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    const handleHealthChange = (event: CustomEvent<HealthStatus>) => {
      setState(prev => ({
        ...prev,
        backendHealth: event.detail
      }));
    };

    const handleApiLoading = () => {
      setState(prev => ({ ...prev, isLoading: true }));
    };

    const handleApiIdle = () => {
      setState(prev => ({ ...prev, isLoading: false }));
    };

    const handleApiRetry = (event: CustomEvent) => {
      setState(prev => ({
        ...prev,
        retryCount: event.detail.retryCount
      }));
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('health-status-change', handleHealthChange as EventListener);
    window.addEventListener('api-loading', handleApiLoading);
    window.addEventListener('api-idle', handleApiIdle);
    window.addEventListener('api-retry', handleApiRetry as EventListener);

    // Initial backend warmup
    const warmup = async () => {
      try {
        await HealthService.warmupBackend();
      } catch (error) {
        console.log('Backend warmup failed, will retry automatically');
      }
    };
    warmup();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('health-status-change', handleHealthChange as EventListener);
      window.removeEventListener('api-loading', handleApiLoading);
      window.removeEventListener('api-idle', handleApiIdle);
      window.removeEventListener('api-retry', handleApiRetry as EventListener);
    };
  }, []);

  return state;
}